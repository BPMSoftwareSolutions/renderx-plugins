import React from "react";
import { getFieldRenderer } from "../field-renderers";
import { getNestedValue } from "../../utils/field.utils";
import { useControlPanelSequences } from "../../hooks/useControlPanelSequences";
import type {
  PropertyField,
  SelectedElement,
} from "../../types/control-panel.types";

interface PropertyFieldProps {
  field: PropertyField;
  selectedElement: SelectedElement;
  onChange: (key: string, value: any) => void;
  onValidate: (fieldKey: string, isValid: boolean, errors: string[]) => void;
}

export const PropertyFieldRenderer: React.FC<PropertyFieldProps> = ({
  field,
  selectedElement,
  onChange,
  onValidate,
}) => {
  const FieldComponent = getFieldRenderer(field.type);
  const value =
    getNestedValue(selectedElement, field.path) || field.defaultValue;
  const sequences = useControlPanelSequences();

  const handleValidate = (isValid: boolean, errors: string[]) => {
    // Use sequence-driven validation if available
    if (sequences.isInitialized) {
      sequences.handleFieldValidation(field, value);
    }
    // Always call the original validation handler for immediate UI feedback
    onValidate(field.key, isValid, errors);
  };

  return (
    <div className="property-item">
      {field.type !== "checkbox" && (
        <label className="property-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
      )}
      <FieldComponent
        field={field}
        value={value}
        onChange={(newValue) => onChange(field.key, newValue)}
        onValidate={handleValidate}
        selectedElement={selectedElement}
      />
      {field.description && field.type !== "checkbox" && (
        <div className="field-description">{field.description}</div>
      )}
    </div>
  );
};
