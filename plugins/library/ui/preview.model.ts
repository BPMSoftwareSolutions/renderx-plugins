export type PreviewModel = {
  tag: string;
  classes: string[];
  text?: string;
  cssText?: string;
  cssTextLibrary?: string;
  cssVars: Record<string, string>;
  attributes?: Record<string, string>;
};

export function computePreviewModel(component: any): PreviewModel {
  const tpl = (component && component.template) || {};
  const tag = typeof tpl.tag === "string" && tpl.tag ? tpl.tag : "div";
  const classes: string[] = Array.isArray(tpl.classes)
    ? tpl.classes.filter((c: any) => typeof c === "string")
    : [];
  const text = typeof tpl.text === "string" ? tpl.text : undefined;
  const cssText =
    typeof tpl.css === "string" && tpl.css.trim() ? tpl.css : undefined;
  const attributes =
    tpl.attributes && typeof tpl.attributes === "object"
      ? tpl.attributes
      : undefined;
  const cssTextLibrary =
    typeof tpl.cssLibrary === "string" && tpl.cssLibrary.trim()
      ? tpl.cssLibrary
      : undefined;
  const baseVars =
    tpl.cssVariables && typeof tpl.cssVariables === "object"
      ? tpl.cssVariables
      : {};
  const libVars =
    tpl.cssVariablesLibrary && typeof tpl.cssVariablesLibrary === "object"
      ? tpl.cssVariablesLibrary
      : {};
  // Merge with library overrides winning
  const merged: Record<string, string> = { ...baseVars, ...libVars } as any;
  const cssVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(merged)) {
    const key = String(k).startsWith("--") ? String(k) : `--${k}`;
    cssVars[key] = String(v);
  }
  return { tag, classes, text, cssText, cssTextLibrary, cssVars, attributes };
}
