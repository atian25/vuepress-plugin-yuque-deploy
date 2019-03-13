'use strict';

const assert = require('assert');
const utils = require('../lib/utils');

describe('test/utils.test.js', () => {
  it('.padFilePath()', () => {
    assert(utils.padFilePath('') === './README.md');
    assert(utils.padFilePath('./') === './README.md');
    assert(utils.padFilePath('./config') === './config.md');
    assert(utils.padFilePath('./config.md') === './config.md');
    assert(utils.padFilePath('../guide/') === '../guide/README.md');
    assert(utils.padFilePath('/guide/') === '/guide/README.md');
    assert(utils.padFilePath('/guide/faq') === '/guide/faq.md');
    assert(utils.padFilePath('/guide/faq.md') === '/guide/faq.md');
  });

  it('.normalizeFilePath()', () => {
    assert(utils.normalizeFilePath('./README.md', '/quickstart/') === '/quickstart/README.md');
    assert(utils.normalizeFilePath('../guide/README.md', '/quickstart/') === '/guide/README.md');
    assert(utils.normalizeFilePath('/guide/README.md', '/quickstart/') === '/guide/README.md');
  });

  it('.getParentDirs()', () => {
    assert.deepEqual(utils.getParentDirs('/a/b/c/'), [ '/', '/a/', '/a/b/', '/a/b/c/' ]);
    assert.deepEqual(utils.getParentDirs('/a/b/c'), [ '/', '/a/', '/a/b/', '/a/b/c/' ]);
    assert.deepEqual(utils.getParentDirs('a/b/c/'), [ '/', '/a/', '/a/b/', '/a/b/c/' ]);
    assert.deepEqual(utils.getParentDirs('a/b/c'), [ '/', '/a/', '/a/b/', '/a/b/c/' ]);
    assert.deepEqual(utils.getParentDirs('/a/'), [ '/', '/a/' ]);
    assert.deepEqual(utils.getParentDirs('/'), [ '/' ]);
  });

  it('.getTree', () => {
    const sidebar = {
      '/quickstart/': [
        { title: 'README', url: '/quickstart/README.md' },
        './config',
      ],
      '/ecosystem/data/': [
        './README.md',
      ],
      '/ecosystem/security/': [
        './README.md',
        './csrf',
      ],
      '/ecosystem/workflow/development': [
        './init',
        './dev',
      ],
      '/ecosystem/data/mysql': [
        './', './faq.md',
      ],
    };
    const root = utils.getTree(sidebar);
    console.log(JSON.stringify(root, null, 2));
  });

  it.only('.normalizeSidebar()', () => {
    const sidebarInfo = [
      './',
      './config.md',
      [ './config.md', 'config alias' ],
      {
        title: 'Ecosystem Group',
        collapsable: false,
        children: [
          '/ecosystem/db/mysql/',
          '/ecosystem/db/mysql/faq',
          '/ecosystem/db/mysql/faq.md',
          '../ecosystem/db/mysql/faq.md',

          [ '/ecosystem/db/mysql/', 'mysql alias' ],
          [ '/ecosystem/db/mysql/faq', 'faq alias' ],
          [ '/ecosystem/db/mysql/faq.md', 'faq alias2' ],
          [ '../ecosystem/db/mysql/faq.md', 'faq relative alias' ],
        ],
      },
    ];

    const result = utils.normalizeSidebar(sidebarInfo, '/quickstart/');
    console.log(JSON.stringify(result, null, 2));
  });
});
