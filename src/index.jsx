import React from 'react';
import { MiradorPhysicalRulerWrapper } from './MiradorPhysicalRulerWrapper.jsx';

/**
 * 現在の windowId に対応する canvas オブジェクトを state から引く
 *
 * Mirador 4 の wrap モードでは mapStateToProps の第2引数は
 * { targetProps: { windowId } } 形式で渡される。
 */
function mapStateToProps(state, { targetProps: { windowId } }) {
  const window = state.windows?.[windowId];
  if (!window) return {};

  const { canvasId, manifestId } = window;
  const manifest = state.manifests?.[manifestId]?.json;
  if (!manifest) return {};

  // IIIF Presentation 3.x / 2.x 両対応
  const items = manifest.items || manifest.sequences?.[0]?.canvases || [];
  const canvas = items.find(c => (c.id || c['@id']) === canvasId) || items[0] || null;

  if (!canvas) return {};

  const canvasWidth  = canvas.width  || 1000;
  const canvasHeight = canvas.height || 1000;

  return { canvas, canvasWidth, canvasHeight };
}

/**
 * createPlugin(options?) → Mirador 4 plugin 配列を返す
 *
 * @param {object} options
 * @param {string} options.color      - ルーラーの色 (デフォルト: '#fcfcfc')
 * @param {number} options.thickness  - ルーラーの幅px (デフォルト: 22)
 */
export function createPlugin(options = {}) {
  const { color = '#fcfcfc', thickness = 22, fallbackScale = null, fallbackUnits = 'mm' } = options;

  const WrappedRuler = (props) => (
    <MiradorPhysicalRulerWrapper
      {...props}
      rulerColor={color}
      rulerThickness={thickness}
      fallbackScale={fallbackScale}
      fallbackUnits={fallbackUnits}
    />
  );

  return [
    {
      component: WrappedRuler,
      mapStateToProps,
      mode: 'wrap',
      target: 'OpenSeadragonViewer',
    },
  ];
}

// デフォルトエクスポート（設定不要で即使えるバージョン）
export default createPlugin();
