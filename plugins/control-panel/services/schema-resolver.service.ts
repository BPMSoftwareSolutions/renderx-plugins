import type {
  ControlPanelConfig,
  PropertyField,
  SelectedElement,
  ComponentSchema,
  SectionConfig,
} from "../types/control-panel.types";

/**
 * SchemaResolverService - Converts component JSON schemas into control panel configurations
 * This is the key service that makes the control panel data-driven
 */
export class SchemaResolverService {
  private static schemaCache: Map<string, ComponentSchema> = new Map();
  private static inflight: Map<string, Promise<ComponentSchema | undefined>> =
    new Map();

  private config: ControlPanelConfig;
  private componentSchemas: Map<string, ComponentSchema> = new Map();

  constructor(config: ControlPanelConfig) {
    this.config = config;
  }

  /**
   * Register a component schema for dynamic property generation
   */
  registerComponentSchema(componentType: string, schema: ComponentSchema) {
    this.componentSchemas.set(componentType, schema);
  }

  /**
   * Load component schemas from JSON files with cross-instance memoization
   * - Dedupes concurrent loads via an in-flight map
   * - Caches resolved schemas for subsequent instances
   */
  async loadComponentSchemas(componentTypes: string[]) {
    const promises = componentTypes.map(async (type) => {
      try {
        // 1) If cached, reuse immediately
        const cached = SchemaResolverService.schemaCache.get(type);
        if (cached) {
          this.registerComponentSchema(type, cached);
          return;
        }

        // 2) If a load is in-flight, await it and then register
        const inflight = SchemaResolverService.inflight.get(type);
        if (inflight) {
          const result = await inflight;
          if (result) {
            SchemaResolverService.schemaCache.set(type, result);
            this.registerComponentSchema(type, result);
          }
          return;
        }

        // 3) Start a new fetch and memoize the promise
        const p = (async () => {
          try {
            const response = await fetch(`/json-components/${type}.json`);
            if (response.ok) {
              const schema: ComponentSchema = await response.json();
              SchemaResolverService.schemaCache.set(type, schema);
              return schema;
            }
            return undefined;
          } catch {
            // Silently handle schema loading failures
            return undefined;
          }
        })();
        SchemaResolverService.inflight.set(type, p);

        const schema = await p;
        // Clear inflight once resolved
        SchemaResolverService.inflight.delete(type);
        if (schema) this.registerComponentSchema(type, schema);
      } catch {
        // Silently handle schema loading failures
      }
    });

    await Promise.all(promises);
  }

  /**
   * Generate property fields for a selected element based on its component schema
   */
  generatePropertyFields(selectedElement: SelectedElement): PropertyField[] {
    const componentType = selectedElement.header.type;
    const schema = this.componentSchemas.get(componentType);

    const fields: PropertyField[] = [];

    // (Debug logger removed – schema now preloaded for html)

    // 1. Generate fields from component schema (if available)
    if (schema?.integration?.properties?.schema) {
      const properties = schema.integration.properties.schema;

      Object.entries(properties).forEach(([key, propSchema]) => {
        const ui: any = (propSchema as any).ui || {};
        const initialType = this.mapSchemaTypeToFieldType(
          propSchema.type,
          propSchema.enum,
          key
        );
        const field: PropertyField = {
          key,
          label: this.formatLabel(key),
          type: ui.control === "code" ? "code" : initialType,
          path: this.inferPropertyPath(key, selectedElement),
          section: this.inferSection(key),
          required: propSchema.required || false,
          description: propSchema.description,
          defaultValue: propSchema.default,
          placeholder: this.generatePlaceholder(key, propSchema.type),
          options: propSchema.enum
            ? propSchema.enum.map((value) => ({
                value,
                label: this.formatLabel(value.toString()),
              }))
            : undefined,
          rendererProps: ui && Object.keys(ui).length ? { ...ui } : undefined,
        };

        // (Removed legacy fallback & diagnostics – html schema now loaded explicitly)

        if (propSchema.validation) {
          field.validation = propSchema.validation;
        }

        // Legacy fallback for HTML markup: ensure code editor when ui.control is absent
        if (componentType === "html" && key === "markup") {
          field.type = "code";
          field.rendererProps = {
            rows: 8,
            ...(field.rendererProps || {}),
          } as any;
        }

        fields.push(field);

        // (Removed debug instrumentation)
      });
    }

    // 1.5 Add derived UI field(s) for specific components (no special-case logic in plugins proper)
    if (componentType === "svg") {
      // Provide a simple structure view for sub-node selection; rendered-only field
      fields.push({
        key: "structure",
        label: "Structure",
        type: "svgTree",
        path: "content.svgMarkup",
        section: "content",
        description: "Explore children and click to highlight on canvas",
      } as any);

      // Provide an inspector to edit attributes of the currently selected sub-node
      fields.push({
        key: "nodeInspector",
        label: "SVG Node Inspector",
        type: "svgNodeInspector",
        path: "content.svgMarkup",
        section: "content",
        description:
          "Edit attributes (fill, stroke, size, position) of the selected SVG sub-node",
      } as any);
    }

    // 2. Always add universal layout fields
    const layoutFields = this.generateUniversalLayoutFields(selectedElement);
    fields.push(...layoutFields);

    // 3. Always add universal styling fields
    const stylingFields = this.generateUniversalStylingFields(selectedElement);
    fields.push(...stylingFields);

    // 4. Add any additional fields from the actual element structure (for backwards compatibility)
    const additionalFields = this.generateAdditionalFields(
      selectedElement,
      fields
    );
    fields.push(...additionalFields);

    return this.sortFieldsBySection(fields);
  }

  /**
   * Generate sections configuration for a component type
   */
  generateSections(componentType: string): SectionConfig[] {
    const override = this.config.componentTypeOverrides[componentType];
    const baseSections = [...this.config.defaultSections];

    if (!override) {
      return baseSections;
    }

    // Apply component-specific overrides
    const sections = baseSections.map((section) => {
      const sectionOverride = override.sections[section.id];
      if (sectionOverride) {
        return {
          ...section,
          title: sectionOverride.title || section.title,
          order: sectionOverride.order || section.order,
        };
      }
      return section;
    });

    // Add any new sections defined in the override
    Object.entries(override.sections).forEach(
      ([sectionId, sectionOverride]) => {
        if (!sections.find((s) => s.id === sectionId)) {
          sections.push({
            id: sectionId,
            title: sectionOverride.title || this.formatLabel(sectionId),
            icon: "📋",
            order: sectionOverride.order || 999,
            collapsible: true,
            defaultExpanded: false,
          });
        }
      }
    );

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Validate a field value against its schema
   */
  validateField(
    field: PropertyField,
    value: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required validation
    if (
      field.required &&
      (value === null || value === undefined || value === "")
    ) {
      errors.push(`${field.label} is required`);
    }

    // Type-specific validation
    if (value !== null && value !== undefined && value !== "") {
      switch (field.type) {
        case "number":
          if (isNaN(Number(value))) {
            errors.push(`${field.label} must be a number`);
          }
          break;
        case "color":
          if (!/^#[0-9A-F]{6}$/i.test(value)) {
            errors.push(`${field.label} must be a valid hex color`);
          }
          break;
      }
    }

    // Custom validation rules
    if (field.validation) {
      field.validation.forEach((rule) => {
        const validationResult = this.applyValidationRule(
          rule,
          value,
          field.label
        );
        if (!validationResult.isValid) {
          errors.push(...validationResult.errors);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  // Private helper methods
  private generateUniversalLayoutFields(
    _selectedElement: SelectedElement
  ): PropertyField[] {
    return [
      {
        key: "x",
        label: "X Position",
        type: "number",
        path: "layout.x",
        section: "layout",
        description: "Horizontal position in pixels",
      },
      {
        key: "y",
        label: "Y Position",
        type: "number",
        path: "layout.y",
        section: "layout",
        description: "Vertical position in pixels",
      },
      {
        key: "width",
        label: "Width",
        type: "number",
        path: "layout.width",
        section: "layout",
        description: "Width in pixels",
      },
      {
        key: "height",
        label: "Height",
        type: "number",
        path: "layout.height",
        section: "layout",
        description: "Height in pixels",
      },
    ];
  }

  private generateUniversalStylingFields(
    _selectedElement: SelectedElement
  ): PropertyField[] {
    return [
      {
        key: "bg-color",
        label: "Background Color",
        type: "color",
        path: "styling.bg-color",
        section: "styling",
        placeholder: "#007acc",
        description: "Background color in hex format",
      },
      {
        key: "text-color",
        label: "Text Color",
        type: "color",
        path: "styling.text-color",
        section: "styling",
        placeholder: "#ffffff",
        description: "Text color in hex format",
      },
      {
        key: "border-radius",
        label: "Border Radius",
        type: "text",
        path: "styling.border-radius",
        section: "styling",
        placeholder: "4px",
        description: "Border radius (e.g., 4px, 50%)",
      },
      {
        key: "font-size",
        label: "Font Size",
        type: "text",
        path: "styling.font-size",
        section: "styling",
        placeholder: "14px",
        description: "Font size (e.g., 14px, 1.2em)",
      },
    ];
  }

  private generateAdditionalFields(
    selectedElement: SelectedElement,
    existingFields: PropertyField[]
  ): PropertyField[] {
    const fields: PropertyField[] = [];
    const existingKeys = new Set(existingFields.map((f) => f.key));

    // Add any fields from the actual element structure that aren't already covered
    if (selectedElement.content) {
      Object.keys(selectedElement.content).forEach((key) => {
        if (!existingKeys.has(key)) {
          fields.push({
            key,
            label: this.formatLabel(key),
            type: this.inferFieldType(selectedElement.content![key]),
            path: `content.${key}`,
            section: "content",
          });
        }
      });
    }

    if (selectedElement.styling) {
      Object.keys(selectedElement.styling).forEach((key) => {
        if (!existingKeys.has(key)) {
          fields.push({
            key,
            label: this.formatLabel(key),
            type: key.includes("color") ? "color" : "text",
            path: `styling.${key}`,
            section: "styling",
          });
        }
      });
    }

    return fields;
  }

  private generateFallbackFields(
    selectedElement: SelectedElement
  ): PropertyField[] {
    // This method is now only used when no component schema is available at all
    const fields: PropertyField[] = [];

    // Generate basic fields from the current element structure
    if (selectedElement.content) {
      Object.keys(selectedElement.content).forEach((key) => {
        fields.push({
          key,
          label: this.formatLabel(key),
          type: this.inferFieldType(selectedElement.content![key]),
          path: `content.${key}`,
          section: "content",
        });
      });
    }

    // Add universal fields
    fields.push(...this.generateUniversalLayoutFields(selectedElement));
    fields.push(...this.generateUniversalStylingFields(selectedElement));

    return fields;
  }

  private mapSchemaTypeToFieldType(
    schemaType: string,
    enumValues?: string[],
    fieldKey?: string
  ): string {
    if (enumValues) return "select";

    // Smart type inference based on field key
    if (fieldKey && fieldKey.includes("color")) return "color";

    switch (schemaType) {
      case "string":
        return "text";
      case "number":
        return "number";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  }

  private inferPropertyPath(
    key: string,
    selectedElement: SelectedElement
  ): string {
    // Smart path inference based on key patterns and element structure
    if (selectedElement.content && key in selectedElement.content)
      return `content.${key}`;
    if (selectedElement.layout && key in selectedElement.layout)
      return `layout.${key}`;
    if (selectedElement.styling && key in selectedElement.styling)
      return `styling.${key}`;

    // Default inference based on key patterns
    if (["x", "y", "width", "height"].includes(key)) return `layout.${key}`;
    if (key.includes("color") || key.includes("font") || key.includes("border"))
      return `styling.${key}`;

    return `content.${key}`;
  }

  private inferSection(key: string): string {
    if (["x", "y", "width", "height", "position"].includes(key))
      return "layout";
    if (
      key.includes("color") ||
      key.includes("font") ||
      key.includes("border") ||
      key.includes("shadow")
    )
      return "styling";
    if (key.includes("click") || key.includes("hover") || key.includes("event"))
      return "behavior";
    return "content";
  }

  private inferFieldType(value: any): string {
    if (typeof value === "boolean") return "checkbox";
    if (typeof value === "number") return "number";
    return "text";
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/-/g, " ")
      .replace(/_/g, " ");
  }

  private generatePlaceholder(key: string, type: string): string {
    if (type === "number") return "0";
    if (key.includes("color")) return "#007acc";
    if (key.includes("size") || key.includes("radius")) return "4px";
    return `Enter ${key}...`;
  }

  private sortFieldsBySection(fields: PropertyField[]): PropertyField[] {
    const sectionOrder = this.config.defaultSections.reduce(
      (acc, section, index) => {
        acc[section.id] = index;
        return acc;
      },
      {} as Record<string, number>
    );

    return fields.sort((a, b) => {
      const aOrder = sectionOrder[a.section] ?? 999;
      const bOrder = sectionOrder[b.section] ?? 999;
      return aOrder - bOrder;
    });
  }

  private applyValidationRule(
    rule: any,
    value: any,
    fieldLabel: string
  ): { isValid: boolean; errors: string[] } {
    // Implementation of custom validation rules
    const errors: string[] = [];

    switch (rule.type) {
      case "min":
        if (typeof value === "number" && value < rule.value) {
          errors.push(`${fieldLabel} must be at least ${rule.value}`);
        }
        break;
      case "max":
        if (typeof value === "number" && value > rule.value) {
          errors.push(`${fieldLabel} must be at most ${rule.value}`);
        }
        break;
      case "pattern":
        if (typeof value === "string" && !new RegExp(rule.value).test(value)) {
          errors.push(rule.message || `${fieldLabel} format is invalid`);
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }
}
