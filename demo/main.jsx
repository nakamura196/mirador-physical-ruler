import Mirador from 'mirador';
import { createPlugin } from '../src/index.jsx';

const BASE = import.meta.env.BASE_URL || '/';

// ?manifest= パラメータで外部マニフェストを指定可能
const params = new URLSearchParams(window.location.search);
const manifestParam = params.get('manifest');

const defaultWindows = [
  { manifestId: `${BASE}demo/manifest-kaitou.json` },
  { manifestId: `${BASE}demo/manifest-ryukyu.json` },
];

const windows = manifestParam
  ? [{ manifestId: manifestParam }]
  : defaultWindows;

const plugin = createPlugin({
  color: '#ffffff',
});

Mirador.viewer(
  {
    id: 'mirador',
    windows,
  },
  plugin
);
