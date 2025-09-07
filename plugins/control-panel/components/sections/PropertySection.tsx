import React from 'react';
import { PropertyFieldRenderer } from './PropertyFieldRenderer';
import type { SectionConfig, PropertyField, SelectedElement } from '../../types/control-panel.types';

interface PropertySectionProps {
  section: SectionConfig;
  fields: PropertyField[];
  selectedElement: SelectedElement;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (key: string, value: any) => void;
  onValidate: (fieldKey: string, isValid: boolean, errors: string[]) => void;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
  section,
  fields,
  selectedElement,
  isExpanded,
  onToggle,
  onChange,
  onValidate
}) => {
  const sectionFields = fields.filter(field => field.section === section.id);

  if (sectionFields.length === 0) return null;

  return (
    <div className="property-section">
      <div
        className={`property-section-title ${section.collapsible ? 'collapsible' : ''}`}
        onClick={section.collapsible ? onToggle : undefined}
      >
        <span>{section.title}</span>
        {section.collapsible && (
          <span className={`collapse-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        )}
      </div>
      {isExpanded && (
        <div className="property-grid">
          {sectionFields.map(field => (
            <PropertyFieldRenderer
              key={field.key}
              field={field}
              selectedElement={selectedElement}
              onChange={onChange}
              onValidate={onValidate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
