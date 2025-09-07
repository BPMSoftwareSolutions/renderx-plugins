import React from 'react';
import type { FieldRendererProps } from '../../types/control-panel.types';

export const SelectInput: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = ''
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    
    // Validate
    const validationErrors: string[] = [];
    
    if (field.required && !newValue) {
      validationErrors.push(`${field.label} is required`);
    }
    
    setErrors(validationErrors);
    onValidate?.(validationErrors.length === 0, validationErrors);
    onChange(newValue);
  };

  const hasErrors = errors.length > 0;

  return (
    <div className={`field-input select-input ${className}`}>
      <select
        className={`property-input ${hasErrors ? 'error' : ''}`}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        title={field.description}
      >
        {!field.required && (
          <option value="">{field.placeholder || 'Choose option...'}</option>
        )}
        {field.options?.map((option) => (
          <option 
            key={option.value.toString()} 
            value={option.value.toString()}
            disabled={option.disabled}
            title={option.description}
          >
            {option.label}
          </option>
        ))}
      </select>
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
