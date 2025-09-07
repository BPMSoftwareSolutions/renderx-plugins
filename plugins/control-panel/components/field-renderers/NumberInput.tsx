import React from 'react';
import type { FieldRendererProps } from '../../types/control-panel.types';

export const NumberInput: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = ''
}) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = e.target.value;
    setLocalValue(stringValue);
    
    const numericValue = stringValue === '' ? null : Number(stringValue);
    
    // Validate
    const validationErrors: string[] = [];
    
    if (field.required && (stringValue === '' || numericValue === null)) {
      validationErrors.push(`${field.label} is required`);
    }
    
    if (stringValue !== '' && (isNaN(numericValue!) || numericValue === null)) {
      validationErrors.push(`${field.label} must be a valid number`);
    }
    
    if (field.validation && numericValue !== null && !isNaN(numericValue)) {
      field.validation.forEach(rule => {
        switch (rule.type) {
          case 'min':
            if (numericValue < rule.value) {
              validationErrors.push(`${field.label} must be at least ${rule.value}`);
            }
            break;
          case 'max':
            if (numericValue > rule.value) {
              validationErrors.push(`${field.label} must be at most ${rule.value}`);
            }
            break;
        }
      });
    }
    
    setErrors(validationErrors);
    onValidate?.(validationErrors.length === 0, validationErrors);
    onChange(numericValue);
  };

  const hasErrors = errors.length > 0;

  return (
    <div className={`field-input number-input ${className}`}>
      <input
        type="number"
        className={`property-input ${hasErrors ? 'error' : ''}`}
        value={localValue}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled}
        title={field.description}
        step="any"
      />
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
