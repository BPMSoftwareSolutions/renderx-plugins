// Template utilities: parse tag/classes and resolve tokens
export function parseTemplateShape(template) {
  try {
    const tagMatch = template && template.match(/<\s*([a-zA-Z0-9-]+)/);
    const tag = (tagMatch ? tagMatch[1] : "div").toLowerCase();
    const classMatch = template && template.match(/class\s*=\s*"([^"]*)"/);
    const classes = classMatch ? classMatch[1].split(/\s+/).filter(Boolean) : [];
    return { tag, classes };
  } catch {
    return { tag: "div", classes: [] };
  }
}

export function resolveTemplateTokens(str, vars) {
  try {
    if (!str) return str;
    return String(str).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_m, key) {
      return vars && vars[key] != null ? String(vars[key]) : "";
    });
  } catch {
    return str;
  }
}

