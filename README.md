# mirador-physical-ruler

Mirador 4 用の物理寸法ルーラープラグイン。
IIIF マニフェストの canvas に `physdim` サービスが設定されていれば、
ビューア上に mm / cm / inch 単位のスケールルーラーを SVG でオーバーレイ表示します。

## インストール

```bash
npm install mirador-physical-ruler
```

## 使い方

### 基本（デフォルト設定）

```js
import Mirador from 'mirador';
import physicalRulerPlugin from 'mirador-physical-ruler';

Mirador.viewer(
  { id: 'mirador', windows: [{ manifestId: 'https://example.com/manifest.json' }] },
  physicalRulerPlugin
);
```

### カスタム設定

```js
import Mirador from 'mirador';
import { createPlugin } from 'mirador-physical-ruler';

const rulerPlugin = createPlugin({
  color: '#ffffff',   // ルーラーの色
  thickness: 34,      // ルーラーの幅・高さ (px)
});

Mirador.viewer(
  { id: 'mirador', windows: [{ manifestId: 'https://example.com/manifest.json' }] },
  rulerPlugin
);
```

### オプション一覧

| オプション | デフォルト | 説明 |
|---|---|---|
| `color` | `'#ffffff'` | ルーラーの色 |
| `thickness` | `34` | ルーラーの幅 (px) |
| `fallbackScale` | `null` | physdim service がない場合のフォールバック (mm/px) |
| `fallbackUnits` | `'mm'` | フォールバック時の単位 |

ルーラー左上の歯車ボタンから、フォントサイズ・目盛りサイズ・色・透明度・表示単位（mm/cm/in）をランタイムで変更できます。

---

## IIIF マニフェストへの physdim サービスの追加

canvas の `service` プロパティに以下を埋め込みます。

```json
{
  "id": "https://example.com/canvas/1",
  "type": "Canvas",
  "width": 4096,
  "height": 6000,
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

### physicalScale の計算方法

```
physicalScale = 実物の幅(mm) / canvas.width(px)
```

例: 実物 347mm 幅、canvas.width = 4096px の場合 → `347 / 4096 ≈ 0.0847`

スキャン解像度（dpi）が既知の場合: `physicalScale = 25.4 / dpi`

`physicalUnits` は `"mm"` または `"in"` を指定します。

---

## 動作の仕組み

1. プラグインが `OpenSeadragonViewer` を wrap し、`OSDReferences` から OSD インスタンスを取得
2. `zoom` / `pan` / `animation` イベントを監視してビューポート情報を更新
3. OSD viewport の `getBoundsNoRotate()` と `canvasWidth * physicalScale` から
   「スクリーン 1px = 何 mm」を計算
4. SVG でルーラーを描画（ズームに応じて目盛り間隔を自動調整）

---

## 注意事項

- **Mirador 4.x 専用** です
- physdim サービスが設定されていない canvas ではルーラーは表示されません（`fallbackScale` を設定すれば表示可能）

---

## Acknowledgements

Inspired by [mirador-ruler-plugin](https://github.com/ubleipzig/mirador-ruler-plugin) (Mirador 3) and [dbmdz/mirador-plugins](https://github.com/dbmdz/mirador-plugins) physicalRuler (Mirador 2).

## ライセンス

MIT
