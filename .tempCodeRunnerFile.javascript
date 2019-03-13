function getParentDirs(dir) {
  const result = [];
  if (dir[0] !== '/') dir = '/' + dir;
  if (dir[dir.length - 1] !== '/') dir = dir + '/';
  let index = 1;
  while(index < dir.length) {
    index = dir.indexOf('/', index) + 1;
    result.push(dir.substring(0, index));
  }
  return result;
}

console.log(getParentDirs('/a/b/c/'))
console.log(getParentDirs('/a/b'))
console.log(getParentDirs('a/b'))