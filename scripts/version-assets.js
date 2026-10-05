// Stamps CSS, JS and image links with a content hash (?v=xxxx) so browsers fetch new
// files after every change, even with long-lived caching.
// Run after editing any asset:  node scripts/version-assets.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const pages = ['index.html', 'privacy.html'];
const hash = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(root, f))).digest('hex').slice(0, 8);
for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/(href|src)="(assets\/(?:css|js|img)\/[^"?]+\.(?:css|js|png|jpg|svg))(?:\?v=[0-9a-f]+)?"/g,
    (m, attr, asset) => `${attr}="${asset}?v=${hash(asset)}"`);
  fs.writeFileSync(file, html);
}
console.log('Asset versions updated in', pages.join(', '));
