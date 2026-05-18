import Mirador from 'mirador';
import { createPlugin } from '../src/index.jsx';

const BASE = import.meta.env.BASE_URL || '/';

// ?manifest= パラメータで外部マニフェストを指定可能
const params = new URLSearchParams(window.location.search);
const manifestParam = params.get('manifest');

const HYAKKI = `${BASE}demo/manifest-hyakki.json`;
const KAITOU = `${BASE}demo/manifest-kaitou.json`;
const RYUKYU = `${BASE}demo/manifest-ryukyu.json`;

// リソース一覧（Mirador の追加パネルから開ける）
const catalog = [
  { manifestId: HYAKKI },
  { manifestId: KAITOU },
  { manifestId: RYUKYU },
];

// デフォルトで開くウィンドウは百鬼夜行図
const windows = manifestParam
  ? [{ manifestId: manifestParam }]
  : [{ manifestId: HYAKKI }];

const plugin = createPlugin({
  color: '#ffffff',
});

Mirador.viewer(
  {
    id: 'mirador',
    catalog,
    windows,
  },
  plugin
);
