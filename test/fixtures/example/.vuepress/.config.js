'use strict';

const larkPlugin = require('../../../../');

module.exports = {
  title: 'VuePress to Lark',
  plugins: [
    [ larkPlugin ],
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
    sidebar: {
      '/quickstart/': [
        './',
        './config.md',
      ],
    },
  },
};
