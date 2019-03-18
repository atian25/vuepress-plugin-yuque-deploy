'use strict';

const path = require('path');

/**
 * replace filePath to slug
 * @param {String} filePath - file path
 * @return {String} slug which split with `_`
 */
exports.toSlug = filePath => {
  return filePath.toLowerCase()
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\//g, '_');
};

/**
 * @param {String} filePath - path to be convert
 * @return {String} the padded file path
 *
 * | filePath      | Result                |
 * | ------------- | --------------------- |
 * | empty         | ./README.md |
 * | ./            | ./README.md |
 * | ./config      | ./config.md |
 * | ./config.md   | ./config.md |
 * | ../guide/     | /guide/README.md      |
 * | /guide/       | /guide/README.md      |
 * | /guide/faq    | /guide/faq.md         |
 * | /guide/faq.md | /guide/faq.md         |
 */
exports.padFilePath = filePath => {
  if (!filePath) filePath = './';
  if (filePath.endsWith('.md')) return filePath;
  if (filePath.endsWith('/')) return filePath + 'README.md';
  return filePath + '.md';
};

/**
 * @param {String} filePath - path to be convert
 * @param {String} baseDir - base dir
 * @return {String} the normalize file path
 */
exports.normalizeFilePath = (filePath, baseDir) => {
  filePath = exports.padFilePath(filePath);
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(baseDir, filePath);
};

/**
 * get all parent dirs including self
 *
 * @param {String} dir - dir path
 * @return {String[]} parent dirs
 */
exports.getParentDirs = dir => {
  const result = [];

  // normalize path
  if (dir[0] !== '/') dir = '/' + dir;
  if (dir[dir.length - 1] !== '/') dir = dir + '/';

  let index = 0;
  while (index < dir.length) {
    index = dir.indexOf('/', index) + 1;
    result.push(dir.substring(0, index));
  }

  return result;
};

exports.getTree = (obj, handler) => {
  const mappings = new Map();
  const entries = obj instanceof Map ? obj.entries() : Object.entries(obj);
  for (const [ key, item ] of entries) {
    const dirs = exports.getParentDirs(key);
    let target;
    let last;
    for (const dir of dirs) {
      target = mappings.get(dir);
      if (!target) {
        target = {
          type: 'nav',
          filePath: dir,
          title: path.basename(dir),
          children: [],
        };
        mappings.set(dir, target);
        if (last) last.children.push(target);
        if (handler) handler(target);
      }
      last = target;
    }
    target.children.push(...item);
  }
  return mappings.get('/');
};
