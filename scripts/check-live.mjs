#!/usr/bin/env node
/**
 * 本番 (ruler.ldas.jp) と旧 URL の転送を、実際に HTTP で叩いて確かめる。
 * 配布後・独自ドメインの設定後に手元で実行する: npm run test:live
 *
 * 見ること:
 *   1. 新ホストのトップが 200 で、canonical が新ホストを指す
 *   2. トップが読む JS と、その JS が読むチャンク・デモのマニフェスト・robots.txt・sitemap.xml が 200
 *   3. 存在しないパスが 404、http は https へ転送
 *   4. 旧 github.io/mirador-physical-ruler/<path>?<query> が同じパス・クエリのまま新ホストへ 301
 */
import { SITE_URL as NEW, OLD_URL as OLD } from '../site.config.mjs';

const errors = [];
let passed = 0;
const ok = (cond, msg) => (cond ? passed++ : errors.push(msg));
const get = (url, opts = {}) => fetch(url, { redirect: 'manual', ...opts });

// 1, 2
const top = await get(NEW + '/');
ok(top.status === 200, `${NEW}/ → ${top.status} (200 のはず)`);
const html = await top.text();
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
ok(canonical === NEW + '/', `canonical が ${canonical} (${NEW}/ のはず)`);
const scripts = [...html.matchAll(/<script[^>]+src="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
ok(scripts.length > 0, 'トップから /assets/ の JS 参照が見つからない');
const paths = ['/robots.txt', '/sitemap.xml'];
for (const s of scripts) {
  const r = await get(NEW + s);
  ok(r.status === 200, `${NEW}${s} → ${r.status}`);
  const js = await r.text();
  for (const m of js.matchAll(/"(assets\/[\w.-]+\.js)"/g)) paths.push('/' + m[1]);
  for (const m of js.matchAll(/(demo\/manifest-[\w-]+\.json)/g)) paths.push('/' + m[1]);
}
ok(paths.some((p) => p.includes('manifest-')), 'JS からデモのマニフェストが見つからない');
for (const p of [...new Set(paths)]) {
  const r = await get(NEW + p);
  ok(r.status === 200, `${NEW}${p} → ${r.status}`);
}

// 3
{
  const r = await get(NEW + '/no-such-page/');
  ok(r.status === 404, `存在しないページが ${r.status} (404 のはず)`);
  const host = new URL(NEW).host;
  const h = await get(`http://${host}/?manifest=x`);
  const loc = h.headers.get('location');
  ok(h.status === 301 && loc === `${NEW}/?manifest=x`, `http → ${h.status} ${loc} (301 ${NEW}/?manifest=x のはず)`);
}

// 4
const q = '?manifest=' + encodeURIComponent('https://example.com/manifest.json');
for (const path of ['/', '/' + q, '/demo/manifest-hyakki.json', '/robots.txt']) {
  const r = await get(OLD + path);
  const loc = r.headers.get('location');
  ok(r.status === 301 && loc === NEW + path, `${OLD}${path} → ${r.status} ${loc} (301 ${NEW + path} のはず)`);
}

if (errors.length) {
  console.error(`NG: ${errors.length} 件 (OK ${passed} 件)`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log(`OK: ${passed} 件`);
