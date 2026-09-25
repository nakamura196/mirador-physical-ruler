// デモサイトの公開先。URL を変えるときはここだけを直す (テストと点検スクリプトもここを読む)。
export const SITE_URL = 'https://ruler.ldas.jp';

// 移行前の公開先。github.io は独自ドメインへ 301 で転送される。
export const OLD_URL = 'https://nakamura196.github.io/mirador-physical-ruler';

// デモのビルドの base。既定はホスト直下 (ruler.ldas.jp)。
// CI ではサブパス配下でも壊れないことを確かめるため DEMO_BASE=/mirador-physical-ruler/ でもビルドする。
export function demoBase(env = process.env) {
  const b = env.DEMO_BASE || '/';
  return b.endsWith('/') ? b : b + '/';
}
