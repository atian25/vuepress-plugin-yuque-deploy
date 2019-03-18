'use strict';

// const Deployer = require('..').Deployer;
const coffee = require('coffee');
const path = require('path');

describe('test/index.test.js', () => {
  const cli = path.join(__dirname, '../node_modules/.bin/vuepress');
  const fixture = path.join(__dirname, 'fixtures/example');

  it('should work', () => {
    return coffee.fork(cli, [ 'yuque-deploy', fixture ])
      .debug()
      .end();
  });

  describe('sidebar', () => {
    it('should support array', () => {
      // const deployer = new Deployer({}, {
      //   vuepressDir: path.join(fixture, '.vuepress'),
      //   themeConfig: {
      //     sidebar: {
      //       '/quickstart/': [
      //         './',
      //         './config.md',
      //         [ './config.md', 'config alias' ],
      //         {
      //           title: 'Ecosystem Group',
      //           collapsable: false,
      //           children: [
      //             '/ecosystem/db/mysql/',
      //             '/ecosystem/db/mysql/faq',
      //             '/ecosystem/db/mysql/faq.md',
      //             '../ecosystem/db/mysql/faq.md',

      //             [ '/ecosystem/db/mysql/', 'mysql alias' ],
      //             [ '/ecosystem/db/mysql/faq', 'faq alias' ],
      //             [ '/ecosystem/db/mysql/faq.md', 'faq alias2' ],
      //             [ '../ecosystem/db/mysql/faq.md', 'faq relative alias' ],
      //           ],
      //         },
      //       ],
      //     },
      //   },
      // });

      // const result = deployer.calcTOC();
    });
  });
});
