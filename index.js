'use strict';

const Deployer = require('./lib/deployer');

exports.Deployer = Deployer;

exports.cli = (options, ctx) => {
  return {
    name: 'vuepress-plugin-yuque-deploy',
    extendCli(cli) {
      cli
        .command('yuque-deploy [dir]', 'sync docs to yuque')
        .option('--debug', 'display info in debug mode')
        .action((dir = './docs') => {
          const deployer = new Deployer(options, ctx);
          console.log('[LarkDeployer] start...');
          deployer.run()
            .then(() => {
              console.log('[LarkDeployer] finish.');
            })
            .catch(err => {
              console.error('[LarkDeployer] fail:', err);
            });
        });
    },
  }
};
