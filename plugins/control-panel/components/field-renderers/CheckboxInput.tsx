import React from 'react';
import type { FieldRendererProps } from '../../types/control-panel.types';

export const CheckboxInput: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = ''
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    
    // Checkboxes typically don't have validation errors
    onValidate?.(true, []);
    onChange(newValue);
  };

  return (
    <div className={`field-input checkbox-input ${className}`}>
      <label className="property-label checkbox-label">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={disabled}
          title={field.description}
        />
        <span className="checkbox-text">{field.label}</span>
        {field.description && (
          <span className="field-description">{field.description}</span>
        )}
      </label>
    </div>
  );
};
