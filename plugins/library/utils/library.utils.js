/**
 * Utility functions for the Library component
 */

/**
 * Converts CSS variables object to React style object
 * @param {Record<string, string>} vars - CSS variables object
 * @returns {React.CSSProperties} Style object
 */
export function varsToStyle(vars) {
  const style = {};
  if (!vars) return style;
  for (const [k, v] of Object.entries(vars)) {
    // Allow custom CSS var keys on style object
    style[k] = v;
  }
  return style;
}

/**
 * Filters and returns only data attributes from an object
 * @param {Record<string, string>} attrs - Attributes object
 * @returns {Record<string, string>} Filtered data attributes
 */
export function pickDataAttrs(attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs || {}))
    if (k.startsWith("data-")) out[k] = v;
  return out;
}

/**
 * Groups components by their category
 * @param {any[]} components - Array of components
 * @returns {Record<string, any[]>} Components grouped by category
 */
export function groupComponentsByCategory(components) {
  const groups = {};

  components.forEach(component => {
    const category = component?.template?.attributes?.["data-category"] ||
                    component?.metadata?.category ||
                    "basic";

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(component);
  });

  return groups;
}

/**
 * Gets the display name for a category
 * @param {string} category - Category key
 * @returns {string} Display name for the category
 */
export function getCategoryDisplayName(category) {
  const categoryNames = {
    basic: "Basic Components",
    layout: "Layout Components",
    form: "Form Components",
    ui: "UI Components"
  };

  return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1) + " Components";
}
