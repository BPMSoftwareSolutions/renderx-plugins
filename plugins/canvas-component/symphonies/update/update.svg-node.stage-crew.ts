import { EventRouter } from "@renderx/host-sdk";

// Whitelist of allowed SVG attributes that can be safely updated
const ALLOWED_SVG_ATTRIBUTES = new Set([
  // Common styling attributes
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  
  // Position and size attributes for rect
  "x",
  "y",
  "width",
  "height",
  
  // Position and size attributes for circle
  "cx",
  "cy",
  "r",
  
  // Position and size attributes for ellipse
  "rx",
  "ry",
  
  // Transform attribute (with caution)
  "transform",
]);

/**
 * Safely update an attribute on an SVG sub-node.
 * 
 * data: { id: string; path: string; attribute: string; value: any }
 *  - id: the Canvas component id (expected to be the <svg> element id)
 *  - path: slash-separated child indices (element-only), e.g. "0/1/0"
 *  - attribute: the SVG attribute to update (must be in whitelist)
 *  - value: the new value for the attribute
 */
export async function updateSvgNodeAttribute(data: any, ctx?: any) {
  const { id, path, attribute, value } = data || {};
  
  if (!id || !path || !attribute) {
    ctx?.logger?.warn?.("SVG node update requires id, path, and attribute");
    return;
  }

  // Validate attribute is in whitelist
  if (!ALLOWED_SVG_ATTRIBUTES.has(attribute)) {
    ctx?.logger?.warn?.(`SVG attribute '${attribute}' is not allowed for security reasons`);
    return;
  }

  const root = document.getElementById(String(id)) as HTMLElement | null;
  if (!root) {
    ctx?.logger?.warn?.(`SVG component with id ${id} not found`);
    return;
  }

  // Traverse to target element using the same logic as showSvgNodeOverlay
  let target: Element = root;
  if (typeof path === "string" && path.trim().length) {
    const parts = path
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n >= 0);

    for (const idx of parts) {
      const elementChildren = Array.from(target.children);
      if (!elementChildren.length || idx >= elementChildren.length) {
        ctx?.logger?.warn?.(`Invalid path segment at index ${idx} for path '${path}'`);
        return;
      }
      target = elementChildren[idx];
    }
  }

  try {
    // Apply the attribute update
    if (value === null || value === undefined || value === "") {
      // Remove the attribute if value is null/undefined/empty
      target.removeAttribute(attribute);
    } else {
      // Set the attribute with the new value
      const stringValue = String(value);
      target.setAttribute(attribute, stringValue);
    }

    // Store the updated attribute info for potential use by other handlers
    ctx.payload = ctx.payload || {};
    ctx.payload.updatedSvgNode = { id, path, attribute, value };
    ctx.payload.elementId = id;

    ctx?.logger?.info?.(`Updated SVG node attribute: ${attribute} = ${value} at path ${path}`);
  } catch (error) {
    ctx?.logger?.warn?.(`Failed to update SVG node attribute ${attribute}:`, error);
  }
}

/**
 * Refresh the Control Panel after updating an SVG node attribute.
 * This reuses the existing refresh logic from the main update handler.
 */
export function refreshControlPanel(data: any, ctx: any) {
  // After updating the SVG node, refresh the Control Panel to show the changes
  const elementId = ctx.payload?.elementId;
  
  if (!elementId) {
    ctx?.logger?.warn?.("No element ID found for Control Panel refresh");
    return;
  }

  try {
    // Publish the control panel update request
    EventRouter.publish(
      "control.panel.update.requested",
      { 
        id: elementId,
        source: "svg-node-update"
      },
      ctx?.conductor
    );
  } catch (error) {
    ctx?.logger?.warn?.("Failed to refresh Control Panel after SVG node update:", error);
  }
}
