export function computeInstanceClass(tag: string, id: string): string {
  const type = tag;
  const shortId = String(id).replace(/^rx-node-/, "");
  return `rx-comp-${type}-${shortId}`;
}

export function computeCssVarBlock(
  vars: Record<string, string | number> | undefined
): string {
  const cssVars: Record<string, string> = Object.entries(vars || {}).reduce(
    (acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    },
    {} as Record<string, string>
  );
  const varDecl = Object.entries(cssVars)
    .map(([k, v]) => `--${k}: ${String(v)};`)
    .join(" ");
  return varDecl ? `{ ${varDecl} }` : "";
}

export function computeInlineStyle(
  data: any,
  tpl: any
): Record<string, string> {
  const style: Record<string, string> = {};

  // Apply template.style properties first (background, color, padding, etc.)
  if (tpl?.style && typeof tpl.style === "object") {
    Object.assign(style, tpl.style);
  }

  // Apply position (overrides any position from template.style)
  if (data?.position) {
    style.position = "absolute";
    style.left =
      typeof data.position.x === "number"
        ? `${data.position.x}px`
        : String(data.position.x);
    style.top =
      typeof data.position.y === "number"
        ? `${data.position.y}px`
        : String(data.position.y);
  }

  // Apply dimensions (overrides any width/height from template.style)
  if (tpl?.dimensions) {
    const { width, height } = tpl.dimensions;
    if (width != null)
      style.width = typeof width === "number" ? `${width}px` : String(width);
    if (height != null)
      style.height =
        typeof height === "number" ? `${height}px` : String(height);
  }

  return style;
}
