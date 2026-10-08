// Stamps CSS, JS and image links with a content hash (?v=xxxx) so browsers fetch new
// files after every change, even with long-lived caching. Covers every .html page,
// including pages in sub-folders that link with ../assets/...
// Run after editing any asset:  node scripts/version-assets.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'content', 'scripts']);
function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    if (d.isDirectory()) return SKIP.has(d.name) || d.name.startsWith('(') ? [] : pages(path.join(dir, d.name));
    return d.name.endsWith('.html') ? [path.join(dir, d.name)] : [];
  });
}
const cache = {};
const hash = f => cache[f] || (cache[f] = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 8));
let n = 0;
for (const file of pages(root)) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(href|src)="((?:\.\.\/)*assets\/(?:css|js|img)\/[^"?]+\.(?:css|js|png|jpg|svg))(?:\?v=[0-9a-f]+)?"/g,
    (m, attr, asset) => `${attr}="${asset}?v=${hash(path.join(path.dirname(file), asset))}"`);
  fs.writeFileSync(file, html); n++;
}
console.log('Asset versions updated in', n, 'pages');
