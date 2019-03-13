'use strict';

const u = require('unist-builder');
const toU = require('unist-builder-blueprint');
const remark = require('remark');
const escodegen = require('escodegen');

let tree = u('root', [
  u('list', [
    // - a
    u('listItem', [
      u('link', { url: '#abc' }, [ u('text', 'ecosystem') ]),
      // sub
      u('list', [
        u('listItem', [ u('text', 'a1') ]),
        u('listItem', [ u('text', 'a2') ]),
      ]),
    ]),
    // - b
    u('listItem', [
      u('text', 'b'),
      // sub
      u('list', [
        u('listItem', [ u('text', 'b1') ]),
        u('listItem', [ u('text', 'b2') ]),
      ]),
    ]),
  ]),
]);

// console.log(JSON.stringify(tree, null, 2))
// const result = remark().stringify(tree);
// console.log(result);

// const result2 = remark().parse('- ecosystem\n  - data\n  - msg\n');
// console.log(result2)

// const p = '/ecosystem/data/mysql/'.replace(/^\//, '').replace(/\/$/, '').split('/');
// const result = {}
// for (const item of p) {
//   result
// }

// function handler(parent, key) {
//   const node = u('listItem', [
//     u('link', { url: '#abc' }, [ u('text', 'ecosystem') ]),
//     // sub
//     u('list', [
//       u('listItem', [ u('text', 'a1') ]),
//       u('listItem', [ u('text', 'a2') ]),
//     ]),
//   ]);
// }

function createLinkNode(label, url) {
  if (url !== null) url = url || label;
  return u('link', { url }, [ u('text', label) ]);
}

function createListItem(label, children) {
  const node = u('listItem', [
    createListItem(label, null),
  ]);
  if (children && children.length) {
    // node.children.push()
  }
  return node;
}

const root = u('root', []);
const toc = u('list', []);
root.children.push(toc);

toc.children.push(
  u('listItem', [
    createLinkNode('ecosystem'),
    u('list', [
    ])
  ]),
  u('listItem', [
    createLinkNode('msg'),
  ])
);
console.log(root)

const result = remark().stringify(root, {
  commonmark: true,
  emphasis: '*',
  strong: '*',
  rule: '-',
  bullet: '*',
  listItemIndent: '1',
  ruleSpaces: false,
});

console.log(result);
