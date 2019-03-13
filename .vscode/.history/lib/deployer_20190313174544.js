'use strict';

const path = require('path');
const URL = require('url');
const is = require('is-type-of');
const { rimraf, mkdirp } = require('mz-modules');
const { fs } = require('mz');
const remark = require('remark');
const crawl = require('tree-crawl');
const HeadingId = require('heading-id');
const inlineLinks = require('remark-inline-links');
const { selectAll } = require('unist-util-select');
const utils = require('./utils');

module.exports = class LarkDeployer {
  constructor(options, ctx) {
    this.ctx = ctx;
    this.logger = options.logger || console;

    this.options = Object.assign({
      dist: path.join(ctx.vuepressDir, 'deploy_dist'),
      async replaceImageLink(fullPath, ctx) {
        const src = path.relative(ctx.sourceDir, fullPath);
        return `https://raw.githubusercontent.com/atian25/vuepress-plugin-yuque-deploy/master/docs/${src}`;
      },
    }, options);

    this.toc = [];
    this.pageMappings = {};
  }

  async run() {
    await rimraf(this.options.dist);
    await mkdirp(this.options.dist);

    // find pages from sidebar
    const pages = this.collectPages();

    // traverse pages to process markdown
    for (const page of pages) {
      // replace link to slug
      // replace image link
      // remove unrecognizable
      // add origin link
      const result = await this.processMarkdown(page);
      page.content = result.toString();

      // save page to local
      await this.savePage(page);

      // sync page to yuque
    }
    // sync toc
    this.normalizeSidebar();

    // // TODO: parallel
    // // TODO: only process pages from toc
    // await rimraf(this.options.dist);
    // await mkdirp(this.options.dist);
    // for (const page of this.ctx.pages) {
    //   console.log(`[LarkDeployer] processing ${page._relativeFilePath}`);
    //   const result = await this.processMarkdown(page);
    //   const _deployFilePath = path.join(this.options.dist, page._relativeFilePath);
    //   await this.writeFile(page._deployFilePath, result.toString());
    //   console.log(result);
    // }
  }

  collectPages() {
    for (const page of this.ctx.pages) {
      this.normalizePage(page);
      this.pageMappings[page._filePath] = page;
    }
    // TODO: find pages from sidebar
    return this.ctx.pages;
  }

  normalizePage(page) {
    const fullPath = page._filePath;
    const _relativeFilePath = path.relative(this.ctx.sourceDir, fullPath);
    page._relativeFilePath = _relativeFilePath;
    page.fullSlug = _relativeFilePath.toLowerCase().replace(/\//g, '_');
  }

  async processMarkdown(page) {
    return remark()
      .use(inlineLinks)
      .use(() => {
        const self = this;
        return async function transformMarkdown(ast, fileInfo) {
          return self.replaceLink(ast, fileInfo);
        };
      })
      .data('settings', {
        commonmark: true,
        emphasis: '*',
        strong: '*',
        rule: '-',
        listItemIndent: '1',
        ruleSpaces: false,
      })
      .process({
        path: page._filePath,
        relativeFilePath: page._relativeFilePath,
        contents: page._content,
      });
  }

  async replaceLink(ast, fileInfo) {
    const { ctx, pageMappings } = this;
    const { sourceDir } = ctx;

    const nodeList = selectAll('link:not([url^=http]), image:not([url^=http])', ast);
    for (const node of nodeList) {
      let { type, url } = node;
      if (url.endsWith('/')) url += '/README.md';

      // skip external link
      const urlObj = URL.parse(url);
      const { protocol, hash, search, query } = urlObj;
      if (protocol) continue;

      // remove hash && image query
      urlObj.hash = urlObj.search = urlObj.query = undefined;
      let filePath = URL.format(urlObj);

      // convert to full file path
      if (path.isAbsolute(filePath)) {
        filePath = path.join(sourceDir, filePath);
      } else {
        filePath = path.resolve(fileInfo.path, '../', filePath);
      }

      if (type === 'link') {
        // find fullSlug
        if (!path.extname(filePath)) filePath += '.md';
        const targetPage = pageMappings[filePath];
        if (targetPage) {
          // TODO: convert hash to https://github.com/node-modules/heading-id
          node.url = targetPage.fullSlug + (hash || '');
          this.logger.debug(`replace ${url} to ${node.url}`);
        }
      } else {
        // upload image and get url
        // search, query
        node.url = await this.options.replaceImageLink(filePath, ctx);
        // default link to github raw
      }
    }
  }

  async savePage(page) {
    const { content, _relativeFilePath } = page;
    const target = path.join(this.options.dist, _relativeFilePath);
    await mkdirp(path.dirname(target));
    this.logger.debug(`save page ${_relativeFilePath} to ${target}`);
    await fs.writeFile(target, content, 'utf-8');
  }

  getPageTitle(filePath) {
    const page = this.pageMappings[filePath];
    return page ? page.title : path.basename(filePath, '.md');
  }

  normalizeSidebar() {
    const self = this;
    const baseDir = this.ctx.sourceDir;

    function normalizeInfo(info, prefix) {
      let filePath;
      let title;
      if (is.string(info)) {
        // support './README' -> '/{prefix}/README.md'
        filePath = utils.normalizeFilePath(info, prefix);
        title = self.getPageTitle(path.join(baseDir, filePath));
        return { filePath, title };
      } else if (is.array(info)) {
        // support ['./README', 'alias name' ] -> '/{prefix}/README.md'
        filePath = utils.normalizeFilePath(info[0], prefix);
        title = self.getPageTitle(path.join(baseDir, filePath));
        return { filePath, title, alias: info[1] };
      }
    }

    // normalize sidebar info, convert leaf info to object
    // './' => { title: 'README', filePath: '/quickstart/README.md' }
    const sidebar = new Map();
    for (const [ key, arr ] of Object.entries(this.ctx.themeConfig.sidebar)) {
      console.log(`[toc] ${key}`);
      const newArr = [];
      // traverse sidebar info
      for (const info of arr) {
        let item;
        if (is.string(info) || is.array(info)) {
          item = normalizeInfo(info, key);
        } else {
          // group
          item = { title: info.title };
          item.children = info.children.map(v => normalizeInfo(v, key));
        }
        newArr.push(item);
      }
      sidebar.set(key, newArr);
    }
    // console.log(sidebar);

    // convert sidebar to tree
    const tree = utils.getTree(sidebar, item => {
      if (!item.title) {
        const filePath = utils.normalizeFilePath(item.id, '/');
        const title = self.getPageTitle(path.join(baseDir, filePath));
        item.title = title;
      }
      return item;
    });
    console.log(JSON.stringify(tree, null, 2));
    const toc = [];
    crawl(tree, (node, context) => {
      const calculater = new HeadingId();
      // console.log(node, context.depth, calculater.id(node.title && node.title.toLowerCase().replace(/\s+/g, '_')));
      const { depth } = context;
      const { id, alias, title, url, filePath } = node;
      if (depth === 0) return;
      toc.push(`${'  '.repeat(depth - 1)}- [${alias || title || id}](${url || filePath || ''})`);
    });
    console.log(toc.join('\n'));
    console.log(toc.join('\\n'));
  }

  async collectTOC() {

  }
}

