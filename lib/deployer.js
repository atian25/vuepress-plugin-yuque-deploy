'use strict';

const path = require('path');
const assert = require('assert');
const extend = require('extend2');
const { URL, fileURLToPath, pathToFileURL } = require('url');

const { fs } = require('mz');
const { rimraf, mkdirp, sleep } = require('mz-modules');
const httpclient = require('urllib');
const remark = require('remark');
const inlineLinks = require('remark-inline-links');
const { selectAll } = require('unist-util-select');
const u = require('unist-builder');
const crawl = require('tree-crawl');

module.exports = class Deployer {
  constructor(options, ctx) {
    this.ctx = ctx;
    this.logger = options.logger || console;

    ctx.yuque = extend(true, {
      dryRun: false,
      dist: path.join(ctx.tempPath, 'deploy_dist'),
      site: {
        title: ctx.siteConfig.title,
        url: undefined,
      },
      api: {
        endpoint: 'https://www.yuque.com',
        repo: undefined,
        token: undefined,
      },
      async replaceImageLink(filePath, urlObj) {
        const hash = decodeURIComponent(urlObj.hash);
        return `${this.ctx.themeConfig.repo}/raw/master/docs${filePath}${urlObj.search}${hash}`;
      },
    }, options);

    assert(ctx.yuque.api.repo, 'yuque repo is required');
    assert(ctx.yuque.api.token, 'yuque token is required');

    this.toc = [];
  }

  async run() {
    await rimraf(this.ctx.yuque.dist);
    await mkdirp(this.ctx.yuque.dist);

    // traverse pages to process markdown
    for (const page of this.ctx.pages) {
      const result = await this.processMarkdown(page);
      page.content = result.toString();

      // sync page to yuque
      await this.syncPage(page);
      await sleep(50);
    }
    // sync toc
    this.navToc = this.getNavToc();
    await this.syncToc();
  }

  async processMarkdown(page) {
    return remark()
      .use(inlineLinks)
      .use(() => {
        return async (ast, fileInfo) => {
          // add origin link
          await this.addOriginRef(ast, fileInfo);
          // remove unrecognizable
          await this.replaceTip(ast, fileInfo);
          // replace link to slug, replace image link
          await this.replaceLink(ast, fileInfo);
        };
      })
      .data('settings', {
        // commonmark: true,
        emphasis: '*',
        strong: '*',
        rule: '-',
        listItemIndent: '1',
        ruleSpaces: false,
      })
      .process({
        path: page._filePath,
        contents: page._strippedContent,
        page,
      });
  }

  async addOriginRef(ast, fileInfo) {
    ast.children.unshift(
      u('blockquote', [
        u('paragraph', [
          u('text', `该文档自动同步于 ${this.ctx.yuque.site.title} 官网。`),
          u('link', { url: `${this.ctx.yuque.site.url}${fileInfo.page.regularPath}` }, [ u('text', '点击此处访问原文。') ]),
        ]),
      ]),
      u('thematicBreak')
    );
  }

  async replaceTip(ast) {
    const nodeList = selectAll('text[value^=:::tip], text[value^=::: tip]', ast);
    for (const node of nodeList) {
      node.value = node.value.replace(/^:::\s*([a-zA-Z]+\s*(.+))/, (m, p1, p2) => {
        return `::: info ${p2 ? p2 + '\n**' + p2 + '**' : ''}`;
      });
    }
  }

  async replaceLink(ast, fileInfo) {
    const { page } = fileInfo;
    const currentFilePath = page._strippedFilePath;

    const nodeList = selectAll('link:not([url^=http]), image:not([url^=http])', ast);
    for (const node of nodeList) {
      const { type, url } = node;

      // convert `/quickstart/README.md` + `./config.md#test` to `/quickstart/config.md#test`
      const urlObj = new URL(url, pathToFileURL(currentFilePath));
      const hash = decodeURIComponent(urlObj.hash);
      let filePath = fileURLToPath(urlObj);

      if (type === 'link') {
        // find fullSlug
        if (filePath.endsWith('/')) filePath += 'README.md';
        if (!path.extname(filePath)) filePath += '.md';
        const page = this.getPage(filePath);
        if (page) node.url = page.fullSlug + hash;
      } else {
        // default link to github raw
        node.url = await this.ctx.yuque.replaceImageLink.call(this, filePath, urlObj);
      }
    }
  }

  async syncPage(page) {
    await this.saveFile(page.fullSlug, page.content);

    if (this.ctx.yuque.dryRun) return;

    const data = {
      title: page.title || page.fullSlug,
      slug: page.fullSlug,
      format: 'markdown',
      body: page.content,
    };

    let doc = await this.request({ api: `docs/${page.fullSlug}`, method: 'GET' });
    if (doc.status !== 404) {
      const id = doc.data.data.id;
      doc = await this.request({
        api: `docs/${id}`,
        method: 'put',
        data,
      });
    } else {
      doc = await this.request({
        api: 'docs',
        method: 'POST',
        data,
      });
    }
    const { repo, endpoint } = this.ctx.yuque.api;
    this.logger.info(`sync ${page.fullSlug} to ${endpoint}/${repo}/${page.fullSlug} , id=${doc.data.data && doc.data.data.id}`);
  }

  async saveFile(fileName, content) {
    const target = path.join(this.ctx.yuque.dist, fileName);
    this.logger.info(`Saving ${target}`);
    await mkdirp(path.dirname(target));
    await fs.writeFile(target, content, 'utf-8');
  }

  async syncToc() {
    this.logger.info('TOC:', this.navToc.join('\n'));
    await this.saveFile('toc_nav.md', this.navToc.join('\n'));

    if (this.ctx.yuque.dryRun) return;

    await this.request({
      method: 'PUT',
      data: {
        toc: this.navToc.join('\n'),
      },
    });
    this.logger.info('sync toc');
  }

  async request({ api, method, data }) {
    const { repo, endpoint, token } = this.ctx.yuque.api;
    const url = `${endpoint}/api/v2/repos/${repo}/${api || ''}`;
    return await httpclient.request(url, {
      method,
      contentType: 'json',
      dataType: 'json',
      headers: {
        'User-Agent': `VuePress Deploy by ${encodeURIComponent(this.ctx.siteConfig.title)}`,
        'X-Auth-Token': token,
      },
      data,
    });
  }

  getPage(filePath) {
    if (!filePath) return;
    if (filePath.endsWith('/')) filePath = filePath + 'README.md';
    if (!filePath.startsWith(this.ctx.sourceDir)) filePath = path.join(this.ctx.sourceDir, filePath);
    return this.ctx._pageMappings[filePath];
  }

  getNavToc() {
    const toc = [];
    const tree = this.ctx._sidebarTree;
    crawl(tree, (node, context) => {
      const { depth } = context;
      if (depth === 0) return;

      let { type, title, filePath, url = '' } = node;

      switch (type) {
        case 'doc': {
          const page = this.getPage(filePath);
          if (!title) title = page ? page.title : path.basename(filePath, '.md');
          url = page ? page.fullSlug : '';
          break;
        }

        case 'nav': {
          const page = this.getPage(filePath + 'README.md');
          if (page) title = page.frontmatter.navTitle || page.title;
          break;
        }

        default: break;
      }

      toc.push(`${'  '.repeat(depth - 1)}- [${title}](${url})`);
    });
    return toc;
  }
};
