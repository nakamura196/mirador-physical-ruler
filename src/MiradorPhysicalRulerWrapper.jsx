import React, { useState, useEffect, useRef } from 'react';
import { OSDReferences } from 'mirador';
import { PhysicalRuler } from './PhysicalRuler.jsx';

/**
 * MiradorPhysicalRulerWrapper
 *
 * Mirador 4 の wrap モードプラグイン。
 * OpenSeadragonViewer を wrap してルーラーを SVG オーバーレイとして描画する。
 *
 * wrap モードでは TargetComponent + targetProps が渡される。
 * OSD インスタンスは OSDReferences.get(windowId) で取得する。
 */
export function MiradorPhysicalRulerWrapper({
  TargetComponent,
  targetProps,
  canvas,
  canvasWidth,
  canvasHeight,
  rulerColor,
  rulerThickness,
  fallbackScale,
  fallbackUnits,
}) {
  const [osdViewer, setOsdViewer] = useState(null);
  const windowId = targetProps.windowId;

  useEffect(() => {
    let cancelled = false;

    function tryGetViewer() {
      if (cancelled) return;

      const ref = OSDReferences.get(windowId);
      const viewer = ref && ref.current;
      if (viewer) {
        setOsdViewer(viewer);
        return;
      }

      // OSD がまだマウントされていない場合はリトライ
      setTimeout(tryGetViewer, 200);
    }

    tryGetViewer();
    return () => { cancelled = true; };
  }, [windowId]);

  // wrap した div が OSD のサイズを潰さないよう、
  // 親の高さを継承する必要がある
  return (
    <div style={{ position: 'relative', display: 'flex', flex: 1, width: '100%', minHeight: 0 }}>
      <TargetComponent {...targetProps} />

      {osdViewer && canvas && (
        <PhysicalRuler
          viewer={osdViewer}
          canvas={canvas}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          color={rulerColor}
          thickness={rulerThickness}
          fallbackScale={fallbackScale}
          fallbackUnits={fallbackUnits}
        />
      )}
    </div>
  );
}
