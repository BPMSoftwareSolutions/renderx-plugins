// Field Renderer Components - Extensible field type system
export { TextInput } from "./TextInput";
export { NumberInput } from "./NumberInput";
export { SelectInput } from "./SelectInput";
export { CheckboxInput } from "./CheckboxInput";
export { ColorInput } from "./ColorInput";
export { CodeTextarea } from "./CodeTextarea";
export { SvgTreeView } from "./SvgTreeView";
export { SvgNodeInspector } from "./SvgNodeInspector";

// Field Renderer Registry
import type { FieldRendererProps } from "../../types/control-panel.types";
import { TextInput } from "./TextInput";
import { NumberInput } from "./NumberInput";
import { SelectInput } from "./SelectInput";
import { CheckboxInput } from "./CheckboxInput";
import { ColorInput } from "./ColorInput";
import { CodeTextarea } from "./CodeTextarea";
import { SvgTreeView } from "./SvgTreeView";
import { SvgNodeInspector } from "./SvgNodeInspector";

export type FieldRenderer = React.ComponentType<FieldRendererProps>;

export const FIELD_RENDERERS: Record<string, FieldRenderer> = {
  TextInput,
  NumberInput,
  SelectInput,
  CheckboxInput,
  ColorInput,
  CodeTextarea,
  SvgTreeView,
  SvgNodeInspector,
};

/**
 * Register a custom field renderer
 */
export function registerFieldRenderer(type: string, component: FieldRenderer) {
  FIELD_RENDERERS[type] = component;
}

/**
 * Get field renderer by type
 */
export function getFieldRenderer(type: string): FieldRenderer {
  // Map field types to component names
  const typeToComponent: Record<string, string> = {
    text: "TextInput",
    number: "NumberInput",
    select: "SelectInput",
    checkbox: "CheckboxInput",
    color: "ColorInput",
    code: "CodeTextarea",
    svgTree: "SvgTreeView",
    svgNodeInspector: "SvgNodeInspector",
  };

  const componentName = typeToComponent[type] || "TextInput";
  return FIELD_RENDERERS[componentName] || TextInput;
}
