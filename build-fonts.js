/* build-fonts.js — lädt Google-Fonts lokal (offline-fest), schreibt fonts/fonts.css.
 * Holt Hanken Grotesk (nur latin + latin-ext) und Material Symbols Outlined.
 * Erneut ausführen nur wenn sich Schriften/Gewichte ändern:  node build-fonts.js
 */
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FONT_DIR = path.join(__dirname, 'fonts');
const KEEP_SUBSETS = ['latin', 'latin-ext'];

async function getCss(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`CSS ${url}: HTTP ${r.status}`);
  return r.text();
}
async function download(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Font ${url}: HTTP ${r.status}`);
  fs.writeFileSync(path.join(FONT_DIR, file), Buffer.from(await r.arrayBuffer()));
  return file;
}
// @font-face-Blöcke mit vorangestelltem /* subset */-Kommentar zerlegen
function blocks(css) {
  const out = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css))) out.push({ subset: m[1], css: m[2] });
  return out;
}
const weightOf = (b) => (b.css.match(/font-weight:\s*(\d+)/) || [])[1] || '400';
const urlOf = (b) => (b.css.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];

(async () => {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  let outCss = '/* Auto-generiert von build-fonts.js — nicht von Hand editieren. */\n';

  // Hanken Grotesk: nur latin + latin-ext
  const hanken = await getCss('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
  for (const b of blocks(hanken)) {
    if (!KEEP_SUBSETS.includes(b.subset)) continue;
    const w = weightOf(b);
    const file = `hanken-${w}-${b.subset}.woff2`;
    await download(urlOf(b), file);
    outCss += b.css.replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(${file})`) + '\n';
    console.log('  +', file);
  }

  // Material Symbols Outlined (eine Variable-Font-Datei)
  const sym = await getCss('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
  for (const b of blocks(sym).length ? blocks(sym) : [{ subset: 'all', css: sym.match(/@font-face\s*\{[^}]*\}/)[0] }]) {
    const file = 'material-symbols.woff2';
    await download(urlOf(b), file);
    outCss += b.css.replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(${file})`) + '\n';
    console.log('  +', file);
  }

  fs.writeFileSync(path.join(FONT_DIR, 'fonts.css'), outCss);
  // Temp-Dateien weg
  for (const f of fs.readdirSync(FONT_DIR)) if (f.startsWith('_')) fs.unlinkSync(path.join(FONT_DIR, f));
  console.log('fonts/fonts.css geschrieben.');
})().catch((e) => { console.error('FEHLER:', e.message); process.exit(1); });
