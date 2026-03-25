import Mirador from 'mirador';
import { createPlugin } from '../src/index.jsx';

// 海東諸国紀（史料編纂所）— physdim service 付き
const TEST_MANIFEST_URL = '/demo/manifest-kaitou.json';

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
        manifestId: '/demo/manifest-ryukyu.json',
      },
    ],
  },
  plugin
);
