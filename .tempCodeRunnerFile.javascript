const { URL } = require('url');
const url = require('url');

const a = new URL('../test.md?as#abc', url.pathToFileURL('/ab/c.md'))
console.log(a)
a.hash = 'bcd'
// a.hash = decodeURIComponent(a.hash.substring(1))
console.log('bbb', a.hash, decodeURIComponent(a.hash.substring(1)))
console.log(a.toString())
console.log(url.fileURLToPath(a))
console.log(url.format(a))
console.log(url.format(a, { fragment: false, search: false }))
console.log(url.format(a, { fragment: true, search: false }))
console.log(decodeURIComponent(a.hash))
// console.log(url.format(a, { fragment: false, search: false } + a.hash))

// const b = url.resolve('/ab/c.md', '../test/?as#as');
// console.log(b)
// console.log(url.fileURLToPath(b).toString())