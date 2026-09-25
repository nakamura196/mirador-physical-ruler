// デモサイトの公開 URL とビルド設定を固定するテスト。npm test で実行する (依存なし、node:test)。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SITE_URL, OLD_URL, demoBase } from '../site.config.mjs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('公開先は ruler.ldas.jp', () => {
  assert.equal(SITE_URL, 'https://ruler.ldas.jp');
  assert.equal(OLD_URL, 'https://nakamura196.github.io/mirador-physical-ruler');
});

test('デモの base は既定でホスト直下、DEMO_BASE で変えられる', () => {
  assert.equal(demoBase({}), '/');
  assert.equal(demoBase({ DEMO_BASE: '/mirador-physical-ruler' }), '/mirador-physical-ruler/');
  assert.equal(demoBase({ DEMO_BASE: '/mirador-physical-ruler/' }), '/mirador-physical-ruler/');
});

test('vite.demo.config.js は base を site.config.mjs から取る (直書きしない)', () => {
  const src = read('vite.demo.config.js');
  assert.match(src, /base: demoBase\(\)/);
  assert.doesNotMatch(src, /base: '\//);
});

test('index.html の canonical と og:url は新しい URL', () => {
  const html = read('index.html');
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL}/" />`));
  assert.match(html, new RegExp(`<meta property="og:url" content="${SITE_URL}/" />`));
});

test('robots.txt と sitemap.xml は新しい URL を指す', () => {
  assert.match(read('public/robots.txt'), new RegExp(`^Sitemap: ${SITE_URL}/sitemap.xml$`, 'm'));
  assert.match(read('public/sitemap.xml'), new RegExp(`<loc>${SITE_URL}/</loc>`));
});

test('README とソースに旧 URL が残っていない', () => {
  for (const p of ['README.md', 'index.html', 'demo/main.jsx', 'vite.demo.config.js']) {
    assert.ok(!read(p).includes('github.io/mirador-physical-ruler'), `${p} に旧 URL`);
  }
});

test('デプロイの workflow は Actions で配る型のまま (独自ドメインは Pages 設定で持つ)', () => {
  const yml = read('.github/workflows/deploy.yml');
  assert.match(yml, /actions\/deploy-pages@/);
  assert.match(yml, /npm test/);
  assert.match(yml, /npm run test:site/);
});
