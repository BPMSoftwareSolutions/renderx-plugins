import React from 'react';
import type { FieldRendererProps } from '../../types/control-panel.types';

export const ColorInput: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = ''
}) => {
  const [localValue, setLocalValue] = React.useState(value || '#000000');
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    setLocalValue(value || '#000000');
  }, [value]);

  const validateColor = (colorValue: string): boolean => {
    // Validate hex color format
    return /^#[0-9A-F]{6}$/i.test(colorValue);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate
    const validationErrors: string[] = [];
    
    if (field.required && !newValue.trim()) {
      validationErrors.push(`${field.label} is required`);
    } else if (newValue && !validateColor(newValue)) {
      validationErrors.push(`${field.label} must be a valid hex color (e.g., #FF0000)`);
    }
    
    setErrors(validationErrors);
    onValidate?.(validationErrors.length === 0, validationErrors);
    onChange(newValue);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setErrors([]); // Color picker always produces valid colors
    onValidate?.(true, []);
    onChange(newValue);
  };

  const hasErrors = errors.length > 0;
  const displayColor = validateColor(localValue) ? localValue : '#000000';

  return (
    <div className={`field-input color-input ${className}`}>
      <div className="color-input-container">
        <input
          type="color"
          className="color-picker"
          value={displayColor}
          onChange={handleColorChange}
          disabled={disabled}
          title={`Pick ${field.label}`}
        />
        <input
          type="text"
          className={`property-input color-text ${hasErrors ? 'error' : ''}`}
          value={localValue}
          onChange={handleTextChange}
          placeholder={field.placeholder || '#007acc'}
          disabled={disabled}
          title={field.description}
        />
      </div>
      {hasErrors && (
        <div className="field-errors">
          {errors.map((error, index) => (
            <span key={index} className="field-error">{error}</span>
          ))}
        </div>
      )}
    </div>
  );
};
