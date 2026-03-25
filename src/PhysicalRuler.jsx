import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RulerSettings } from './RulerSettings.jsx';

// IIIF Physical Dimensions service profile URI
const PHYSDIM_PROFILE = 'http://iiif.io/api/annex/services/physdim';

/**
 * canvasのserviceからphysical dimensions情報を取得する
 * IIIF Presentation API 2.x / 3.x 両対応
 */
function getPhysicalDimensions(canvas) {
  if (!canvas) return null;

  // service が配列の場合もあるので正規化
  const services = Array.isArray(canvas.service)
    ? canvas.service
    : canvas.service
    ? [canvas.service]
    : [];

  for (const svc of services) {
    const profile = svc.profile || svc['@type'] || '';
    if (
      profile === PHYSDIM_PROFILE ||
      (svc['@context'] && svc['@context'].includes('physdim'))
    ) {
      const scale = svc.physicalScale ?? svc.physical_scale;
      const units = svc.physicalUnits ?? svc.physical_units;
      if (scale !== undefined && units) {
        return { scale: parseFloat(scale), units };
      }
    }
  }
  return null;
}

/**
 * 目盛り間隔の「きりの良い値」を計算する
 */
function niceInterval(pixelsPerUnit, targetPixels = 80) {
  const rawInterval = targetPixels / pixelsPerUnit;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
  const normalized = rawInterval / magnitude;

  let nice;
  if (normalized < 1.5) nice = 1;
  else if (normalized < 3.5) nice = 2;
  else if (normalized < 7.5) nice = 5;
  else nice = 10;

  return nice * magnitude;
}

/**
 * 目盛りデータを生成する（水平 or 垂直）
 */
function buildTicks(physicalLength, pixelsPerUnit, containerPixels, offsetPhysical) {
  const ticks = [];
  const interval = niceInterval(pixelsPerUnit);
  if (interval <= 0) return { ticks, interval };

  // tick 間のピクセル距離に応じてラベル頻度を調整
  const tickPx = interval * pixelsPerUnit;
  const labelEvery = tickPx >= 50 ? 1 : tickPx >= 25 ? 2 : 5;
  const majorInterval = interval * labelEvery;

  const viewPhysicalEnd = offsetPhysical + containerPixels / pixelsPerUnit;
  const start = Math.ceil(offsetPhysical / interval) * interval;

  // ラベルの小数桁数を interval から決定
  const decimals = interval < 0.01 ? 3 : interval < 0.1 ? 2 : interval < 1 ? 1 : 0;

  for (let pos = start; pos <= Math.min(physicalLength, viewPhysicalEnd); pos += interval) {
    const px = (pos - offsetPhysical) * pixelsPerUnit;
    if (px >= 0 && px <= containerPixels) {
      // major 判定: majorInterval の倍数に近いか
      const isMajor = Math.abs(Math.round(pos / majorInterval) * majorInterval - pos) < interval * 0.01;
      const label = pos.toFixed(decimals);
      ticks.push({ pos, px, isMajor, label });
    }
  }
  return { ticks, interval };
}

/**
 * physdim の単位 (mm or in) から表示単位への変換係数を返す
 * sourceUnits: physdim service の単位 ('mm' or 'in')
 * displayUnits: 表示したい単位 ('mm', 'cm', 'in')
 */
function conversionFactor(sourceUnits, displayUnits) {
  // まず source → mm に変換
  const toMm = sourceUnits === 'in' ? 25.4 : 1.0;
  // mm → display に変換
  let fromMm;
  if (displayUnits === 'cm') fromMm = 0.1;
  else if (displayUnits === 'in') fromMm = 1.0 / 25.4;
  else fromMm = 1.0; // mm
  return toMm * fromMm;
}

const DEFAULT_SETTINGS = {
  fontSize: 16,
  thickness: 34,
  largeDash: 24,
  smallDash: 12,
  color: '#ffffff',
  bgOpacity: 0.7,
  displayUnits: 'cm',
};

/**
 * PhysicalRuler
 */
export function PhysicalRuler({
  viewer,
  canvas,
  canvasWidth,
  canvasHeight,
  color = '#fcfcfc',
  thickness = 28,
  fallbackScale = null,
  fallbackUnits = 'mm',
}) {
  const [rulerState, setRulerState] = useState(null);
  const [settings, setSettings] = useState({
    ...DEFAULT_SETTINGS,
    color,
    thickness,
  });
  const frameRef = useRef(null);

  const updateRuler = useCallback(() => {
    if (!viewer || !canvas) return;

    const physDim = getPhysicalDimensions(canvas);
    const scale = physDim?.scale ?? fallbackScale;
    const units = physDim?.units ?? fallbackUnits;
    if (!scale) return;
    const vp = viewer.viewport;
    const container = viewer.container;
    if (!vp || !container) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    if (!containerW || !containerH) return;

    const bounds = vp.getBoundsNoRotate(true);
    const physicalWidth  = canvasWidth  * scale;  // mm
    const physicalHeight = canvasHeight * scale;  // mm

    // OSD viewport 座標は canvas pixel 座標系（bounds.width ≈ canvasWidth）
    // screen px / viewport_px = containerW / bounds.width
    // 1 viewport_px = scale mm
    // screen px / mm = (containerW / bounds.width) / scale
    const pixelsPerUnit = containerW / (bounds.width * scale);

    const offsetX = bounds.x * scale;        // mm
    const offsetY = bounds.y * scale;         // mm

    setRulerState({
      containerW,
      containerH,
      physicalWidth,
      physicalHeight,
      pixelsPerUnit,
      offsetX,
      offsetY,
      units,
    });
  }, [viewer, canvas, canvasWidth, canvasHeight, fallbackScale, fallbackUnits]);

  useEffect(() => {
    if (!viewer) return;

    const handlers = ['zoom', 'pan', 'resize', 'rotate', 'canvas-drag', 'animation'];
    const onUpdate = () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(updateRuler);
    };

    handlers.forEach(e => viewer.addHandler(e, onUpdate));
    updateRuler();

    return () => {
      handlers.forEach(e => viewer.removeHandler(e, onUpdate));
      cancelAnimationFrame(frameRef.current);
    };
  }, [viewer, updateRuler]);

  if (!rulerState) return null;

  const {
    containerW, containerH,
    physicalWidth, physicalHeight,
    pixelsPerUnit, offsetX, offsetY,
    units,
  } = rulerState;

  const { fontSize, thickness: t, largeDash, smallDash, color: rulerColor, bgOpacity, displayUnits } = settings;

  // physdim の単位 → 表示単位への変換
  const conv = conversionFactor(units, displayUnits);
  const displayPhysicalWidth  = physicalWidth  * conv;
  const displayPhysicalHeight = physicalHeight * conv;
  const displayPixelsPerUnit  = pixelsPerUnit / conv;
  const displayOffsetX = offsetX * conv;
  const displayOffsetY = offsetY * conv;


  const hResult = buildTicks(displayPhysicalWidth,  displayPixelsPerUnit, containerW, displayOffsetX);
  const vResult = buildTicks(displayPhysicalHeight, displayPixelsPerUnit, containerH, displayOffsetY);

  const hTicks = hResult.ticks || [];
  const vTicks = vResult.ticks || [];

  const bgFill = `rgba(0,0,0,${bgOpacity})`;

  return (
    <>
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: containerW,
          height: containerH,
          pointerEvents: 'none',
          zIndex: 100,
          fontFamily: 'monospace',
          fontSize,
          overflow: 'hidden',
        }}
        width={containerW}
        height={containerH}
      >
        {/* 水平ルーラー（上端） */}
        <rect x={t} y={0} width={containerW - t} height={t}
          fill={bgFill} />

        {hTicks.map(({ pos, px, isMajor, label }) => {
          const dashH = isMajor ? largeDash : smallDash;
          const x     = px + t;
          return (
            <g key={`h-${pos}`}>
              <line
                x1={x} y1={t} x2={x} y2={t - dashH}
                stroke={rulerColor} strokeWidth={1}
              />
              {isMajor && (
                <text
                  x={x + 3} y={t - 5}
                  fill={rulerColor} fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="start"
                  paintOrder="stroke"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* 単位ラベル */}
        <text x={t + 4} y={t - 4} fill={rulerColor} fontSize={fontSize}
          fontWeight="bold" dominantBaseline="auto"
          stroke="rgba(0,0,0,0.6)" strokeWidth={3} paintOrder="stroke">
          {displayUnits}
        </text>

        {/* 垂直ルーラー（左端） */}
        <rect x={0} y={t} width={t} height={containerH - t}
          fill={bgFill} />

        {vTicks.map(({ pos, px, isMajor, label }) => {
          const dashW = isMajor ? largeDash : smallDash;
          const y     = px + t;
          return (
            <g key={`v-${pos}`}>
              <line
                x1={t} y1={y} x2={t - dashW} y2={y}
                stroke={rulerColor} strokeWidth={1}
              />
              {isMajor && (
                <text
                  x={t - dashW + fontSize} y={y - 3}
                  fill={rulerColor} fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="start"
                  transform={`rotate(-90, ${t - dashW + fontSize}, ${y - 3})`}
                  paintOrder="stroke"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {/* コーナーの四角 */}
        <rect x={0} y={0} width={t} height={t}
          fill={bgFill} />
      </svg>

      {/* 設定パネル（SVG外、pointer events有効） */}
      <RulerSettings
        settings={settings}
        onChange={setSettings}
        thickness={t}
      />
    </>
  );
}
