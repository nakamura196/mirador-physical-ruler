# mirador-physical-ruler

A Mirador 4 plugin that displays a physical dimensions ruler overlay using the IIIF Physical Dimensions (physdim) service.

IIIF マニフェストの canvas に physdim サービスが設定されていれば、ビューア上にスケールルーラーを SVG でオーバーレイ表示する Mirador 4 プラグインです。

**Demo / デモ**: [https://nakamura196.github.io/mirador-physical-ruler/](https://nakamura196.github.io/mirador-physical-ruler/)

## Installation / インストール

```bash
npm install mirador-physical-ruler
```

## Usage / 使い方

### Basic / 基本

```js
import Mirador from 'mirador';
import physicalRulerPlugin from 'mirador-physical-ruler';

Mirador.viewer(
  { id: 'mirador', windows: [{ manifestId: 'https://example.com/manifest.json' }] },
  physicalRulerPlugin
);
```

### Custom options / カスタム設定

```js
import { createPlugin } from 'mirador-physical-ruler';

const rulerPlugin = createPlugin({
  color: '#ffffff',
  thickness: 34,
});
```

### Options / オプション一覧

| Option | Default | Description |
|---|---|---|
| `color` | `'#ffffff'` | Ruler color / ルーラーの色 |
| `thickness` | `34` | Ruler bar width in px / ルーラーの幅 (px) |
| `fallbackScale` | `null` | Fallback scale (mm/px) when physdim service is absent / physdim がない場合のフォールバック |
| `fallbackUnits` | `'mm'` | Fallback units / フォールバック時の単位 |

The gear button on the top-left corner opens a settings panel where you can change font size, tick size, color, opacity, and display units (mm/cm/in) at runtime.

左上の歯車ボタンから、フォントサイズ・目盛りサイズ・色・透明度・表示単位（mm/cm/in）をランタイムで変更できます。

## Demo with custom manifest / 任意のマニフェストでデモ

You can load any IIIF manifest by appending the `manifest` query parameter:

`?manifest=` パラメータで任意のマニフェストを読み込めます:

```
https://nakamura196.github.io/mirador-physical-ruler/?manifest=https://example.com/manifest.json
```

## Adding physdim service to your manifest / physdim サービスの追加方法

Add the following to the `service` property of your canvas:

canvas の `service` プロパティに以下を追加します:

```json
{
  "service": [
    {
      "@context": "http://iiif.io/api/annex/services/physdim/1/context.json",
      "profile": "http://iiif.io/api/annex/services/physdim",
      "physicalScale": 0.0848,
      "physicalUnits": "mm"
    }
  ]
}
```

### Calculating physicalScale / physicalScale の計算方法

```
physicalScale = physical width (mm) / canvas width (px)
```

If scan resolution (dpi) is known / スキャン解像度がわかっている場合:

```
physicalScale = 25.4 / dpi
```

`physicalUnits`: `"mm"` or `"in"`

## How it works / 動作の仕組み

1. The plugin wraps `OpenSeadragonViewer` and obtains the OSD instance via `OSDReferences`
2. Listens to `zoom` / `pan` / `animation` events to update viewport information
3. Calculates screen pixels per physical unit from `getBoundsNoRotate()` and `canvasWidth * physicalScale`
4. Renders the ruler as SVG with automatically adjusted tick intervals

## Notes / 注意事項

- **Mirador 4.x only** (for Mirador 3, use [mirador-ruler-plugin](https://github.com/ubleipzig/mirador-ruler-plugin))
- The ruler is not displayed on canvases without a physdim service (unless `fallbackScale` is set)

## Acknowledgements

Inspired by [mirador-ruler-plugin](https://github.com/ubleipzig/mirador-ruler-plugin) (Mirador 3) and [dbmdz/mirador-plugins](https://github.com/dbmdz/mirador-plugins) physicalRuler (Mirador 2).

## License

MIT
