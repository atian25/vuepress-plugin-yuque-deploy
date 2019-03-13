'use strict';

const sidebar = {
  '/quickstart/': [
    { title: 'README', url: '/quickstart/README.md'},
    'b',
  ],
  '/ecosystem/data/': [
    'd1', 'd2',
  ],
  '/ecosystem/security/': [
    'c1', 'c2',
  ],
  '/ecosystem/workflow/dev': [
    'cccc1', 'cccc2',
  ],
};

const expected = [
  {
    id: '/quickstart/',
    children: [],
  },
  {
    id: '/ecosystem/',
    children: [
      {
        id: '/ecosystem/data/',
        children: [],
      },
      {
        id: '/ecosystem/security/',
        children: [],
      },
      {
        id: '/ecosystem/workflow/',
        children: [
          {
            id: '/ecosystem/workflow/dev',
            children: [ 'cccc1', 'cccc2' ],
          },
        ],
      },
    ],
  },
]

const  { getParentDirs } = require('./lib/utils');

const mappings = new Map();
for (const [ key, item ] of Object.entries(sidebar)) {
  const dirs = getParentDirs(key);

  let target;
  let last;
  for (const dir of dirs) {
    target = mappings.get(dir);
    if (!target) {
      target = { id: dir, children: [] };
      mappings.set(dir, target);
      if (last) last.children.push(target);
    }
    last = target;
  }
  target.children = item;
}

// console.log(result);

const crawl = require('tree-crawl');
const HeadingId = require('heading-id');

const tree = mappings.get('/');
const result = [];
crawl(tree, (node, context) => {
  const calculater = new HeadingId();
  console.log(node, context.depth, calculater.id(node.title && node.title.toLowerCase().replace(/\s+/g, '_')));
  const { depth } = context;
  const { id, title, url } = node;
  if (depth === 0) return;
  result.push(`${'  '.repeat(depth - 1)}- [${title || id}](${url || ''})`);
});

console.log(result.join('\n'));