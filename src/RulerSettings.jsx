import React, { useState } from 'react';

const panelStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  background: 'rgba(30,30,30,0.95)',
  color: '#eee',
  padding: '12px 16px',
  borderRadius: '0 0 8px 0',
  zIndex: 200,
  fontFamily: 'sans-serif',
  fontSize: 13,
  minWidth: 200,
  pointerEvents: 'auto',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 6,
  gap: 8,
};

const labelStyle = {
  whiteSpace: 'nowrap',
};

const inputStyle = {
  width: 60,
  background: '#444',
  color: '#fff',
  border: '1px solid #666',
  borderRadius: 3,
  padding: '2px 4px',
  fontSize: 13,
  textAlign: 'right',
};

const gearBtnStyle = (thickness) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: thickness,
  height: thickness,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  pointerEvents: 'auto',
  zIndex: 201,
  background: 'rgba(0,0,0,0.5)',
  border: 'none',
  color: '#ccc',
  fontSize: Math.max(thickness * 0.6, 12),
  padding: 0,
  lineHeight: 1,
});

export function RulerSettings({ settings, onChange, thickness }) {
  const [open, setOpen] = useState(false);

  const update = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  const numField = (label, key, min, max, step = 1) => (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type="number"
        style={inputStyle}
        value={settings[key]}
        min={min}
        max={max}
        step={step}
        onChange={(e) => update(key, Number(e.target.value))}
      />
    </div>
  );

  return (
    <>
      <button
        style={gearBtnStyle(thickness)}
        onClick={() => setOpen(!open)}
        title="Ruler settings"
      >
        &#9881;
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
            Ruler Settings
          </div>

          {numField('Font size', 'fontSize', 8, 32)}
          {numField('Ruler width', 'thickness', 16, 60)}
          {numField('Large tick', 'largeDash', 6, 40)}
          {numField('Small tick', 'smallDash', 3, 30)}

          <div style={rowStyle}>
            <span style={labelStyle}>Unit</span>
            <select
              value={settings.displayUnits}
              onChange={(e) => update('displayUnits', e.target.value)}
              style={{
                width: 64,
                background: '#444',
                color: '#fff',
                border: '1px solid #666',
                borderRadius: 3,
                padding: '2px 4px',
                fontSize: 13,
              }}
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Color</span>
            <input
              type="color"
              value={settings.color}
              onChange={(e) => update('color', e.target.value)}
              style={{ width: 36, height: 24, padding: 0, border: '1px solid #666', cursor: 'pointer' }}
            />
          </div>

          <div style={rowStyle}>
            <span style={labelStyle}>Opacity</span>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={settings.bgOpacity}
              onChange={(e) => update('bgOpacity', Number(e.target.value))}
              style={{ width: 80 }}
            />
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 4,
              background: '#555',
              color: '#eee',
              border: 'none',
              borderRadius: 3,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 13,
              width: '100%',
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}
