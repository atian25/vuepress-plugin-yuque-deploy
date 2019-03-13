'use strict';

const path = require('path');
const larkPlugin = require('../../../../');

module.exports = {
  title: 'VuePress to Lark',
  plugins: [
    [ larkPlugin.cli, {
        dist: path.join(__dirname, '../.tmp'),
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
    // https://raw.githubusercontent.com/atian25/blog/master/assets/images/ucweb0.png
    // repo: 'atian25/blog',
    nav: [
      { text: 'QuickStart', link: '/quickstart/' },
    ],
    sidebarDepth: 0,
    // TODO: sidebar could be array
    sidebar: {
      '/quickstart/': [
        './',
        [ './config.md', 'config alias' ],
      ],

      // '/ecosystem/': [
      //   './',
      //   {
      //     title: 'Sub Group',
      //     collapsable: false,
      //     children: [
      //       [ './db/mysql/', 'MySQL alias' ],
      //       './db/redis'
      //     ],
      //   }
      // ],

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

      '/others/': [
        './',
      ],
    },
  },
};
