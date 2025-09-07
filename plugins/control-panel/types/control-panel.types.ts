// Core Control Panel Types
export interface ControlPanelConfig {
  version: string;
  description: string;
  defaultSections: SectionConfig[];
  fieldTypes: Record<string, FieldTypeConfig>;
  componentTypeOverrides: Record<string, ComponentOverride>;
}

export interface SectionConfig {
  id: string;
  title: string;
  icon: string;
  order: number;
  collapsible: boolean;
  defaultExpanded: boolean;
  special?: "classes" | "events" | "custom";
}

export interface FieldTypeConfig {
  component: string;
  validation: string[];
  props: Record<string, any>;
}

export interface ComponentOverride {
  sections: Record<string, SectionOverride>;
}

export interface SectionOverride {
  title?: string;
  fields: string[];
  order?: number;
}

// Property Field Types
export interface PropertyField {
  key: string;
  label: string;
  type: string;
  path: string;
  section: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  conditional?: ConditionalRule;
  rendererProps?: Record<string, any>;
}

export interface FieldOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: any;
  message?: string;
}

export interface ConditionalRule {
  field: string;
  operator: "equals" | "not-equals" | "contains" | "greater-than" | "less-than";
  value: any;
}

// Component Schema Integration
export interface ComponentSchema {
  metadata: {
    type: string;
    name: string;
    version: string;
    category: string;
  };
  integration: {
    properties: {
      schema: Record<string, PropertySchema>;
      defaultValues: Record<string, any>;
    };
  };
}

export interface PropertySchema {
  type: string;
  default?: any;
  description?: string;
  required?: boolean;
  enum?: string[];
  validation?: ValidationRule[];
  ui?: { control?: string; [key: string]: any };
}

// Selection Model
export interface SelectedElement {
  header: {
    type: string;
    id: string;
    componentSchema?: ComponentSchema;
  };
  content?: Record<string, any>;
  layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styling?: Record<string, any>;
  classes?: string[];
  events?: Record<string, any>;
}

// Field Renderer Props
export interface FieldRendererProps {
  field: PropertyField;
  value: any;
  onChange: (value: any) => void;
  onValidate?: (isValid: boolean, errors: string[]) => void;
  disabled?: boolean;
  className?: string;
  selectedElement?: SelectedElement | null;
}

// Control Panel State
export interface ControlPanelState {
  selectedElement: SelectedElement | null;
  currentClasses: string[];
  expandedSections: Set<string>;
  validationErrors: Record<string, string[]>;
  isDirty: boolean;
}

// Action Types
export type ControlPanelAction =
  | { type: "SET_SELECTED_ELEMENT"; payload: SelectedElement | null }
  | { type: "SET_CLASSES"; payload: string[] }
  | { type: "TOGGLE_SECTION"; payload: string }
  | { type: "SET_VALIDATION_ERRORS"; payload: Record<string, string[]> }
  | { type: "SET_DIRTY"; payload: boolean }
  | { type: "RESET_STATE" };
