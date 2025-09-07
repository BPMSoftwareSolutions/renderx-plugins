import React from 'react';
import type { FieldRendererProps } from '../../types/control-panel.types';

export const TextInput: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = ''
}) => {
  const [localValue, setLocalValue] = React.useState(value || '');
  const [errors, setErrors] = React.useState<string[]>([]);

  React.useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Validate
    const validationErrors: string[] = [];
    
    if (field.required && !newValue.trim()) {
      validationErrors.push(`${field.label} is required`);
    }
    
    if (field.validation) {
      field.validation.forEach(rule => {
        switch (rule.type) {
          case 'pattern':
            if (newValue && !new RegExp(rule.value).test(newValue)) {
              validationErrors.push(rule.message || `${field.label} format is invalid`);
            }
            break;
          case 'min':
            if (newValue.length < rule.value) {
              validationErrors.push(`${field.label} must be at least ${rule.value} characters`);
            }
            break;
          case 'max':
            if (newValue.length > rule.value) {
              validationErrors.push(`${field.label} must be at most ${rule.value} characters`);
            }
            break;
        }
      });
    }
    
    setErrors(validationErrors);
    onValidate?.(validationErrors.length === 0, validationErrors);
    onChange(newValue);
  };

  const hasErrors = errors.length > 0;

  return (
    <div className={`field-input text-input ${className}`}>
      <input
        type="text"
        className={`property-input ${hasErrors ? 'error' : ''}`}
        value={localValue}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled}
        title={field.description}
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
