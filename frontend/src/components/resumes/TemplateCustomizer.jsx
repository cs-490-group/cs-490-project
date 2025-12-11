import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * TemplateCustomizer Component
 * Customize colors, fonts, and layout options
 * Related to UC-046
 */
export default function TemplateCustomizer({ colors, fonts, onUpdate }) {
  const [selectedColors, setSelectedColors] = useState(colors || { primary: '#007bff', accent: '#0056b3' });
  const [selectedFonts, setSelectedFonts] = useState(fonts || { heading: 'Arial', body: 'Calibri' });

  const handleColorChange = (colorKey, value) => {
    const updated = { ...selectedColors, [colorKey]: value };
    setSelectedColors(updated);
    onUpdate(updated, selectedFonts);
  };

  const handleFontChange = (fontKey, value) => {
    const updated = { ...selectedFonts, [fontKey]: value };
    setSelectedFonts(updated);
    onUpdate(selectedColors, updated);
  };

  const fontOptions = ['Arial', 'Times New Roman', 'Calibri', 'Verdana', 'Georgia', 'Trebuchet MS'];

  const colorPresets = [
    { name: 'Professional Blue', primary: '#007bff', accent: '#0056b3' },
    { name: 'Modern Green', primary: '#28a745', accent: '#1e7e34' },
    { name: 'Corporate Gray', primary: '#6c757d', accent: '#495057' },
    { name: 'Creative Purple', primary: '#6f42c1', accent: '#4c3682' },
  ];

  return (
    <div className="template-customizer">
      <h3>Customize Template</h3>

      <div className="customizer-section">
        <h5>Colors</h5>
        <div className="color-pickers">
          <div className="color-group">
            <label>Primary Color</label>
            <input
              type="color"
              value={selectedColors.primary}
              onChange={(e) => handleColorChange('primary', e.target.value)}
              className="form-control form-control-color"
            />
          </div>
          <div className="color-group">
            <label>Accent Color</label>
            <input
              type="color"
              value={selectedColors.accent}
              onChange={(e) => handleColorChange('accent', e.target.value)}
              className="form-control form-control-color"
            />
          </div>
        </div>

        <div className="color-presets mt-3">
          <label>Quick Presets</label>
          <div className="preset-buttons">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setSelectedColors({ primary: preset.primary, accent: preset.accent });
                  onUpdate({ primary: preset.primary, accent: preset.accent }, selectedFonts);
                }}
                className="btn btn-sm btn-outline-secondary"
                title={preset.name}
              >
                <span
                  className="preset-swatch"
                  style={{
                    backgroundColor: preset.primary,
                    border: `2px solid ${preset.accent}`,
                  }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="customizer-section mt-4">
        <h5>Fonts</h5>
        <div className="font-selectors">
          <div className="font-group">
            <label>Heading Font</label>
            <select
              value={selectedFonts.heading}
              onChange={(e) => handleFontChange('heading', e.target.value)}
              className="form-select"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <small
              style={{ fontFamily: selectedFonts.heading }}
              className="d-block mt-2"
            >
              Preview: The Quick Brown Fox
            </small>
          </div>

          <div className="font-group">
            <label>Body Font</label>
            <select
              value={selectedFonts.body}
              onChange={(e) => handleFontChange('body', e.target.value)}
              className="form-select"
            >
              {fontOptions.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <small
              style={{ fontFamily: selectedFonts.body }}
              className="d-block mt-2"
            >
              Preview: The Quick Brown Fox
            </small>
          </div>
        </div>
      </div>

      <div className="customizer-section mt-4">
        <h5>Layout Options</h5>
        <div className="form-check">
          <input type="checkbox" id="showBorder" className="form-check-input" defaultChecked={true} />
          <label className="form-check-label" htmlFor="showBorder">
            Show section borders
          </label>
        </div>
        <div className="form-check">
          <input type="checkbox" id="compactMode" className="form-check-input" defaultChecked={false} />
          <label className="form-check-label" htmlFor="compactMode">
            Compact mode (reduce spacing)
          </label>
        </div>
        <div className="form-check">
          <input type="checkbox" id="useTwoColumns" className="form-check-input" defaultChecked={false} />
          <label className="form-check-label" htmlFor="useTwoColumns">
            Use two-column layout for skills
          </label>
        </div>
      </div>

      <div className="alert alert-info mt-4">
        <small>Changes are applied in real-time. Check the preview panel to see your customizations.</small>
      </div>
    </div>
  );
}
