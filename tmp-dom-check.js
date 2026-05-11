const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/script.js', 'utf8');
const ids = new Set([...html.matchAll(/id=['\"]([^'\"]+)['\"]/g)].map(m => m[1]));
const refs = [...js.matchAll(/document\.getElementById\(['\"]([^'\"]+)['\"]\)/g)].map(m => m[1]);
const missing = [...new Set(refs.filter(r => !ids.has(r)))];
console.log(JSON.stringify({ missing, refs: refs.length, ids: ids.size }, null, 2));
