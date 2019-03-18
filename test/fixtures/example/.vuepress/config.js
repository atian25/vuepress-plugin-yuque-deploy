'use strict';

const deployPlugin = require('../../../../');

module.exports = {
  title: 'VuePress to YuQue',
  plugins: [
    [ deployPlugin, {
        site: {
          url: '',
        },
        api: {
          repo: '',
          token: '',
        },
      }
    ],
  ],
  devServer: {
    overlay: {
      warnings: true,
      errors: true,
    },
  },
  themeConfig: {
    repo: 'https://github.com/atian25/vuepress-plugin-yuque-deploy',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'QuickStart', link: '/quickstart/' },
      { text: 'Test', link: '/test/' },
      { text: 'GitHub', link: 'https://github.com/atian25/vuepress-plugin-yuque-deploy' },
    ],
    sidebarDepth: 0,
    // TODO: sidebar could be array
    sidebar: {
      '/quickstart/': [
        './',
        [ './config.md', 'config alias' ],
      ],

      '/guide/': [
        './',
        './link',
      ],

      '/test/sub/': [
        [ '../', 'Back to Test' ],
        [ '/guide/', 'Jump to Guide' ],
        {
          title: 'Group',
          collapsable: false,
          children: [
            './',
            './page1',
            './page2.md',
            [ '../faq', 'FAQ' ],
          ],
        },
      ],

      '/test/': [
        './',
        './sub/',
        './faq',
      ],

      '/ecosystem/db/': [
        './',
        {
          title: 'MySQL',
          collapsable: false,
          children: [
            [ './mysql/', 'MySQL alias' ],
            './mysql/faq.md',
          ],
        },
        './redis',
      ],

      '/ecosystem/schedule/': [
        './',
      ],

      '/ecosystem/': [
        './',
        {
          title: 'Sub Group',
          collapsable: false,
          children: [
            [ './db/mysql/', 'MySQL alias' ],
            './db/redis'
          ],
        }
      ],

      '/other/': [
        './foo',
      ],
    },
  },
};
