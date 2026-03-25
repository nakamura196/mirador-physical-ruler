import Mirador from 'mirador';
import { createPlugin } from '../src/index.jsx';

// Vite の import.meta.env.BASE_URL で GitHub Pages 対応
const BASE = import.meta.env.BASE_URL || '/';

// 海東諸国紀（史料編纂所）— physdim service 付き
const TEST_MANIFEST_URL = `${BASE}demo/manifest-kaitou.json`;

const plugin = createPlugin({
  color: '#ffffff',
});

Mirador.viewer(
  {
    id: 'mirador',
    windows: [
      {
        manifestId: TEST_MANIFEST_URL,
      },
      {
        manifestId: `${BASE}demo/manifest-ryukyu.json`,
      },
    ],
  },
  plugin
);
