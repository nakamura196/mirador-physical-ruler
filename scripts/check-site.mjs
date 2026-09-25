#!/usr/bin/env node
/**
 * デモのビルド結果 (docs/) の中の参照が、すべて実在するファイルを指しているか確かめる。
 *
 * 使い方: npm run build:demo のあとに npm run test:site
 *   サブパス配下でビルドしたときは、同じ DEMO_BASE を付けて実行する
 *   (例: DEMO_BASE=/mirador-physical-ruler/ npm run build:demo && DEMO_BASE=/mirador-physical-ruler/ npm run test:site)
 *
 * 見ること:
 *   1. HTML の href / src / content のうちサイト内を指すもの (/ 始まり・相対・サイトの絶対 URL) が
 *      docs/ のファイルに解決できる
 *   2. / で始まる参照が base から始まっている (base の付け忘れ・二重付け)
 *   3. JS が読み込むチャンク (assets/*.js) とデモのマニフェスト (demo/manifest-*.json) が実在する
 *   4. 旧ホスト (github.io/mirador-physical-ruler) を指す文字列が残っていない。
 *      ホスト直下のビルドでは旧サブパス /mirador-physical-ruler/ も残っていない
 *   5. robots.txt の Sitemap と sitemap.xml の各 URL が実在するページを指す
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import { SITE_URL, OLD_URL, demoBase } from '../site.config.mjs';

const DOCS = new URL('../docs/', import.meta.url).pathname;
const base = demoBase();
const siteUrl = SITE_URL.replace(/\/$/, '');
const FORBIDDEN = [OLD_URL.replace(/^https:\/\//, '')];
if (base === '/') FORBIDDEN.push('/mirador-physical-ruler/');

const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(DOCS)) {
  console.error('docs/ がありません。先に npm run build:demo を実行してください。');
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

/** docs/ 内の配信パス (base を除いたもの) がファイルに解決できるか。GitHub Pages と同じ規則。 */
function resolves(servedPath) {
  let p = decodeURIComponent(servedPath.split(/[?#]/)[0]);
  if (p === '' || p.endsWith('/')) p += 'index.html';
  const abs = join(DOCS, p);
  if (!abs.startsWith(DOCS)) return false;
  if (existsSync(abs) && statSync(abs).isFile()) return true;
  if (existsSync(abs + '.html')) return true;
  return existsSync(join(abs, 'index.html'));
}

const files = walk(DOCS);
let checkedRefs = 0;

function checkRef(ref, file) {
  const where = relative(DOCS, file);
  if (!ref || ref.startsWith('#') || ref.startsWith('data:') || ref.startsWith('mailto:')) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith('//')) {
    // 外部 URL。サイト自身の絶対 URL だけ確かめる (canonical, og:url, sitemap など)。
    if (ref === siteUrl || ref.startsWith(siteUrl + '/')) {
      checkedRefs++;
      if (!resolves(ref.slice(siteUrl.length).replace(/^\//, ''))) {
        fail(`${where}: サイトの絶対 URL がファイルに解決できない: ${ref}`);
      }
    }
    return;
  }
  checkedRefs++;
  if (ref.startsWith('/')) {
    if (!ref.startsWith(base)) {
      fail(`${where}: base (${base}) の付いていない参照: ${ref}`);
      return;
    }
    const rest = ref.slice(base.length);
    if (base !== '/' && rest.startsWith(base.slice(1))) {
      fail(`${where}: base が二重に付いている参照: ${ref}`);
      return;
    }
    if (!resolves(rest)) fail(`${where}: 参照先のファイルが無い: ${ref}`);
    return;
  }
  const fromDir = posix.dirname(relative(DOCS, file).split('\\').join('/'));
  const path = ref.split(/[?#]/)[0];
  const target = posix.normalize(posix.join(fromDir, path));
  if (target.startsWith('..')) {
    fail(`${where}: docs/ の外を指す相対参照: ${ref}`);
    return;
  }
  if (!resolves(target + (path.endsWith('/') ? '/' : ''))) fail(`${where}: 相対参照の先のファイルが無い: ${ref}`);
}

for (const file of files) {
  if (!/\.(html|css|js|txt|xml|json)$/.test(file)) continue;
  const where = relative(DOCS, file);
  const text = readFileSync(file, 'utf8');
  for (const bad of FORBIDDEN) {
    if (text.includes(bad)) fail(`${where}: 旧 URL への参照が残っている: ${bad}`);
  }
  if (file.endsWith('.html')) {
    for (const m of text.matchAll(/\s(href|src|content)="([^"]*)"/g)) {
      const v = m[2].replaceAll('&amp;', '&');
      // content 属性は meta の値。URL らしいものだけを対象にする。
      if (m[1] === 'content' && !(v.startsWith('/') || v.startsWith(siteUrl))) continue;
      checkRef(v, file);
    }
  }
  if (file.endsWith('.js')) {
    // Vite が書き出すチャンクの一覧 ("assets/xxx.js") と、動的 import の相対参照 ("./xxx.js")。
    for (const m of text.matchAll(/"(assets\/[\w.-]+\.(?:js|css))"/g)) {
      checkedRefs++;
      if (!resolves(m[1])) fail(`${where}: 読み込むチャンクが無い: ${m[1]}`);
    }
    for (const m of text.matchAll(/import\("(\.\/[\w.-]+\.js)"\)/g)) checkRef(m[1], file);
    // demo/main.jsx が base の後ろに付けて読むマニフェスト。
    for (const m of text.matchAll(/(demo\/manifest-[\w-]+\.json)/g)) {
      checkedRefs++;
      if (!resolves(m[1])) fail(`${where}: デモのマニフェストが無い: ${m[1]}`);
    }
  }
}

if (!existsSync(join(DOCS, 'index.html'))) fail('index.html が無い');
if (!files.some((f) => /demo\/manifest-[\w-]+\.json$/.test(f))) fail('デモのマニフェストが 1 つも無い');

const robotsPath = join(DOCS, 'robots.txt');
if (!existsSync(robotsPath)) fail('robots.txt が無い');
else if (!readFileSync(robotsPath, 'utf8').includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
  fail(`robots.txt に "Sitemap: ${siteUrl}/sitemap.xml" が無い`);
}
const sitemapPath = join(DOCS, 'sitemap.xml');
if (!existsSync(sitemapPath)) fail('sitemap.xml が無い');
else {
  const locs = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length === 0) fail('sitemap.xml に URL が 1 件も無い');
  for (const loc of locs) checkRef(loc, sitemapPath);
}

if (errors.length) {
  console.error(`NG: ${errors.length} 件 (base=${base})`);
  for (const e of errors.slice(0, 50)) console.error('  ' + e);
  if (errors.length > 50) console.error(`  ... ほか ${errors.length - 50} 件`);
  process.exit(1);
}
console.log(`OK: ${files.length} ファイル、サイト内参照 ${checkedRefs} 件 (base=${base}, siteUrl=${siteUrl})`);
