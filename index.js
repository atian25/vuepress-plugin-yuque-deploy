'use strict';

const path = require('path');
const is = require('is-type-of');

const Deployer = require('./lib/deployer');
const utils = require('./lib/utils');

module.exports = (options, ctx) => {
  return {
    name: 'vuepress-plugin-yuque-deploy',

    extendPageData($page) {
      $page._relativeFilePath = path.relative(ctx.sourceDir, $page._filePath);
      $page._strippedFilePath = '/' + $page._relativeFilePath;
      $page.fullSlug = utils.toSlug($page._relativeFilePath);

      ctx._pageMappings = ctx._pageMappings || {};
      ctx._pageMappings[$page._filePath] = $page;
    },

    async ready() {

      function normalizeInfo(info, prefix) {
        let originPath;
        let title;

        if (is.string(info)) {
          // support './README' -> '/{prefix}/README.md'
          originPath = info;
        } else if (is.array(info)) {
          // support ['./README', 'alias name' ] -> '/{prefix}/README.md'
          originPath = info[0];
          title = info[1];
        }

        const filePath = utils.normalizeFilePath(originPath, prefix);
        return { type: 'doc', filePath, title };
      }

      // normalize sidebar info, convert leaf info to object
      const sidebar = {};
      for (const [ key, arr ] of Object.entries(ctx.themeConfig.sidebar)) {
        const newArr = [];
        for (const info of arr) {
          let item;
          if (is.string(info) || is.array(info)) {
            item = normalizeInfo(info, key);
          } else {
            // group
            item = { type: 'group', title: info.title };
            // group node can also have a link.
            if (info.path) {
              item.filePath = utils.normalizeFilePath(
                info.path.replace(/(\.html|\.md)$/, ''),
                key
              );
            }
            item.children = info.children.map(v => normalizeInfo(v, key));
          }
          newArr.push(item);
        }
        sidebar[key] = newArr;
      }

      // convert sidebar to tree
      const tree = utils.getTree(sidebar);
      ctx._sidebar = sidebar;
      ctx._sidebarTree = tree;
    },

    extendCli(cli) {
      cli
        .command('yuque-deploy [dir]', 'sync docs to yuque')
        .option('--debug', 'display info in debug mode')
        .option('--dry-run', 'only write file not deploy to yuque')
        .action((args, opts) => {
          const deployer = new Deployer(Object.assign(options, opts), ctx);
          console.log('[Deployer] start...', opts);
          deployer.run()
            .then(() => {
              console.log('[Deployer] finish.');
            })
            .catch(err => {
              console.error(`[Deployer] fail: ${err.message}, stack: ${err.stack}`);
            });
        });
    },
  };
};

module.exports.Deployer = Deployer;
