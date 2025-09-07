import fs from "node:fs";
import path from "node:path";

/**
 * Load component JSON template and extract CSS
 */
function loadComponentTemplate(componentType: string): string | null {
  try {
    // Determine the path to the component JSON file
    const componentPath = path.join(
      process.cwd(),
      "public",
      "json-components",
      `${componentType}.json`
    );

    if (!fs.existsSync(componentPath)) {
      return null;
    }

    const content = fs.readFileSync(componentPath, "utf8");
    const json = JSON.parse(content);

    // Extract CSS from template.ui.styles.css
    return json?.ui?.styles?.css || null;
  } catch {
    // Silently fail for missing or malformed component files
    return null;
  }
}

export function parseUiFile(_data: any, ctx: any) {
  try {
    const ui = ctx.payload.uiFileContent;
    if (!ui || typeof ui !== "object")
      throw new Error("No uiFileContent provided");
    if (!Array.isArray(ui.components))
      throw new Error("uiFileContent.components must be an array");

    // Normalize component entries
    const comps = ui.components.map((c: any) => {
      const component: any = {
        id: String(c.id),
        type: String(c.type || c.template?.tag || "div"),
        tag: String(c.template?.tag || c.type || "div"),
        classRefs: Array.isArray(c.template?.classRefs)
          ? c.template.classRefs.slice()
          : [],
        style:
          typeof c.template?.style === "object" && c.template?.style
            ? c.template.style
            : {},
        layout: {
          x: Number(c.layout?.x || 0),
          y: Number(c.layout?.y || 0),
          width: Number(c.layout?.width || 0),
          height: Number(c.layout?.height || 0),
        },
        parentId: c.parentId ?? null,
        siblingIndex: Number(c.siblingIndex || 0),
        createdAt: c.createdAt || Date.now(),
      };

      // Normalize classRefs to always include base classes
      const baseClasses = ["rx-comp", `rx-${component.type}`];
      const existing = Array.isArray(component.classRefs)
        ? component.classRefs.filter(
            (x: any) => typeof x === "string" && x.length
          )
        : [];
      component.classRefs = Array.from(new Set([...baseClasses, ...existing]));

      // Include content properties if they exist
      if (c.content && typeof c.content === "object") {
        component.content = { ...c.content };
      }

      // Load template CSS for this component type
      const templateCss = loadComponentTemplate(component.type);
      if (templateCss) {
        component.css = templateCss;
      }

      return component;
    });

    ctx.payload.importComponents = comps;
    ctx.payload.importCssClasses = ui.cssClasses || {};
  } catch (e) {
    ctx.logger?.error?.("Failed to parse .ui file:", e);
    ctx.payload.importComponents = [];
    ctx.payload.importCssClasses = {};
  }
}
