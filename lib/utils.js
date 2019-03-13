'use strict';

const path = require('path');
const is = require('is-type-of');

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

exports.normalizeSidebar = (arr, baseDir) => {
  const result = [];
  for (const info of arr) {
    const item = {};
    if (is.string(info)) {
      item.filePath = exports.normalizeFilePath(info, baseDir);
    } else if (is.array(info)) {
      item.filePath = exports.normalizeFilePath(info[0], baseDir);
      item.alias = info[1];
    } else {
      // group object
      item.alias = info.title;
      item.children = exports.normalizeSidebar(info.children, baseDir);
    }
    result.push(item);
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
        target = { id: dir, children: [] };
        mappings.set(dir, target);
        if (last) last.children.push(target);
      }
      last = target;
    }
    target.children = item;
    if (handler) handler(target);
  }
  return mappings.get('/');
};
