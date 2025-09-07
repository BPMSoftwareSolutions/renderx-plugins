// Helper function to extract content properties from DOM elements
import { ComponentRuleEngine } from "../../../../src/component-mapper/rule-engine";

const _ruleEngineForExport = new ComponentRuleEngine();

function extractElementContent(
  element: HTMLElement,
  type: string
): Record<string, any> {
  // Delegate to rule engine based on type
  return _ruleEngineForExport.extractContent(element, type);
}

export const collectLayoutData = (data: any, ctx: any) => {
  try {
    let components = ctx.payload.components || [];
    let componentIds = new Set((components || []).map((c: any) => c.id));
    const layoutData: any[] = [];

    // Find canvas container
    const canvas =
      typeof document !== "undefined"
        ? document.getElementById("rx-canvas")
        : null;

    if (!canvas) {
      ctx.payload.error = "Canvas container not found";
      ctx.payload.layoutData = [];
      ctx.payload.canvasMetadata = { width: 0, height: 0 };
      return;
    }

    // Collect canvas metadata
    const canvasRect = canvas.getBoundingClientRect();
    const canvasStyle = window.getComputedStyle(canvas);
    ctx.payload.canvasMetadata = {
      width: parseInt(canvasStyle.width) || canvasRect.width || 0,
      height: parseInt(canvasStyle.height) || canvasRect.height || 0,
    };

    // If no components from KV, perform DOM discovery (stage-crew is allowed to use DOM)
    if (!components || components.length === 0) {
      const canvasEl = document.getElementById("rx-canvas");
      if (canvasEl) {
        const found: any[] = [];
        const els = canvasEl.querySelectorAll(".rx-comp");
        for (const el of Array.from(els)) {
          const htmlEl = el as HTMLElement;
          const classes = Array.from(htmlEl.classList);
          const typeClass = classes.find(
            (cls) => cls.startsWith("rx-") && cls !== "rx-comp"
          );
          const type = typeClass
            ? typeClass.replace("rx-", "")
            : htmlEl.tagName.toLowerCase();

          // Extract some computed styles
          const computed = window.getComputedStyle(htmlEl);
          const style: Record<string, string> = {};
          const props = [
            "padding",
            "margin",
            "border",
            "borderRadius",
            "background",
            "backgroundColor",
            "color",
            "fontSize",
            "fontWeight",
            "textAlign",
            "boxShadow",
            "width",
            "height",
          ];
          for (const p of props) {
            const v = computed.getPropertyValue(p);
            if (v && v !== "initial" && v !== "normal" && v !== "auto")
              style[p] = v;
          }

          // Extract content properties based on element type
          const content = extractElementContent(htmlEl, type);

          found.push({
            id: htmlEl.id,
            type,
            classes,
            style,
            content,
            createdAt: Date.now(),
          });
        }
        ctx.payload.components = found;
        components = found;
        componentIds = new Set(found.map((c: any) => c.id));
      }
    }

    // Refresh componentIds after potential DOM discovery
    const findParentContainerId = (el: HTMLElement | null): string | null => {
      let cur: HTMLElement | null = el?.parentElement || null;
      while (cur) {
        const id = cur.id || null;
        const isContainer = cur.classList?.contains("rx-container");
        if (
          isContainer &&
          id &&
          (ctx.payload.components || []).some((c: any) => c.id === id)
        )
          return id;
        cur = cur.parentElement;
      }
      return null;
    };

    // Helper: compute sibling index among element children that are components
    const computeSiblingIndex = (
      el: HTMLElement,
      parentId: string | null
    ): number => {
      if (!parentId) return 0;
      const parent = el.parentElement as HTMLElement | null;
      if (!parent) return 0;
      const children = Array.from(parent.children) as HTMLElement[];
      const compChildren = children.filter(
        (c) => c.id && componentIds.has(c.id)
      );
      return Math.max(
        0,
        compChildren.findIndex((c) => c.id === el.id)
      );
    };

    // Collect layout data for each component
    for (const component of components) {
      const element = document.getElementById(
        component.id
      ) as HTMLElement | null;

      if (!element) {
        // Component exists in KV but not in DOM
        layoutData.push({
          id: component.id,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          missing: true,
          parentId: null,
          siblingIndex: 0,
        });
        continue;
      }

      // Extract content from DOM element and merge with component data
      const domContent = extractElementContent(element, component.type);
      if (Object.keys(domContent).length > 0) {
        // Update the component with current DOM content
        component.content = { ...component.content, ...domContent };
      }

      let x = 0,
        y = 0,
        width = 0,
        height = 0;

      // Try to get position from CSS styles first
      const style = window.getComputedStyle(element);
      const left = parseInt(style.left) || 0;
      const top = parseInt(style.top) || 0;

      // Check for transform translate values
      const transform = style.transform;
      if (transform && transform !== "none") {
        const translateMatch = transform.match(
          /translate\(([^,]+),\s*([^)]+)\)/
        );
        if (translateMatch) {
          x = parseInt(translateMatch[1]) || 0;
          y = parseInt(translateMatch[2]) || 0;
        } else {
          x = left;
          y = top;
        }
      } else {
        x = left;
        y = top;
      }

      // Get dimensions
      const rect = element.getBoundingClientRect();
      width = parseInt(style.width) || rect.width || 0;
      height = parseInt(style.height) || rect.height || 0;

      // If no CSS positioning, fall back to getBoundingClientRect
      if (x === 0 && y === 0 && style.position !== "absolute") {
        const canvasRect = canvas.getBoundingClientRect();
        x = rect.left - canvasRect.left;
        y = rect.top - canvasRect.top;
      }

      const parentId = findParentContainerId(element);
      const siblingIndex = computeSiblingIndex(element, parentId);

      layoutData.push({
        id: component.id,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
        parentId,
        siblingIndex,
      });
    }

    ctx.payload.layoutData = layoutData;
    ctx.logger?.info?.(
      `Collected layout data for ${layoutData.length} components`
    );
  } catch (error) {
    ctx.logger?.error?.("Failed to collect layout data:", error);
    ctx.payload.error = String(error);
    ctx.payload.layoutData = [];
    ctx.payload.canvasMetadata = { width: 0, height: 0 };
  }
};
