import { resolveInteraction, EventRouter } from "@renderx/host-sdk";

/**
 * Transform import component data to canvas.component.create format
 */
function transformImportDataToCreateFormat(importComponent: any): any {
  const template: any = {
    tag: importComponent.tag,
    classes: importComponent.classRefs || [],
    style: importComponent.style || {},
    text: importComponent.content?.text || importComponent.content?.content,
    // Map other content properties as needed
    cssVariables: importComponent.cssVariables || {},
    css: importComponent.css,
  };

  // Set container role if this is a container component
  if (
    importComponent.classRefs &&
    importComponent.classRefs.includes("rx-container")
  ) {
    template.attributes = { "data-role": "container" };
  }

  // Include content properties if they exist
  if (
    importComponent.content &&
    Object.keys(importComponent.content).length > 0
  ) {
    template.content = importComponent.content;
  }

  // Add dimensions to template if available
  if (importComponent.layout?.width && importComponent.layout?.height) {
    template.dimensions = {
      width: importComponent.layout.width,
      height: importComponent.layout.height,
    };
  }

  return {
    component: {
      template,
    },
    position: {
      x: importComponent.layout?.x || 0,
      y: importComponent.layout?.y || 0,
    },
    containerId: importComponent.parentId || undefined,
    // Override nodeId to preserve imported IDs
    _overrideNodeId: importComponent.id,
  };
}

/**
 * NEW: Sequential component creation handler that uses canvas.component.create
 * as the single source of truth for all component creation
 */
export async function createComponentsSequentially(_data: any, ctx: any) {
  const components: any[] = ctx.payload.importComponents || [];
  const r = resolveInteraction("canvas.component.create");

  // Track created components for hierarchy application
  ctx.payload.createdComponents = [];

  for (const comp of components) {
    // Transform import data to canvas.component.create format
    const createPayload = transformImportDataToCreateFormat(comp);

    // Add interaction handlers (same as library drop flow)
    createPayload.onDragStart = (info: any) => {
      // Match CanvasDrop.ts behavior: mark drag in progress
      try {
        (globalThis as any).__cpDragInProgress = true;
      } catch {}
      // Publish drag.start for subscribers
      try {
        EventRouter.publish(
          "canvas.component.drag.start",
          { id: info?.id },
          ctx.conductor
        );
      } catch {}
    };

    createPayload.onDragMove = (info: any) => {
      // Publish drag.move through EventRouter
      try {
        const { id, position } = info || {};
        EventRouter.publish(
          "canvas.component.drag.move",
          { id, position, event: "canvas:component:drag:move" },
          ctx.conductor
        );
      } catch {}
    };

    createPayload.onDragEnd = (info: any) => {
      // Match CanvasDrop.ts behavior: clear flag
      try {
        (globalThis as any).__cpDragInProgress = false;
      } catch {}
      // Publish drag.end for subscribers
      try {
        const { id, finalPosition, correlationId } = info || {};
        // Map finalPosition to position for consistency with other drag handlers
        const position = finalPosition || info?.position;
        EventRouter.publish(
          "canvas.component.drag.end",
          { id, position, correlationId },
          ctx.conductor
        );
      } catch {}
    };

    createPayload.onSelected = (info: any) => {
      // Handle selection for imported components via topics routing
      try {
        EventRouter.publish(
          "canvas.component.selection.changed",
          { id: info?.id },
          ctx.conductor
        );
      } catch {}
    };

    // Call canvas.component.create for each component
    await ctx.conductor?.play?.(r.pluginId, r.sequenceId, createPayload);

    ctx.payload.createdComponents.push({
      id: comp.id,
      parentId: comp.parentId,
      siblingIndex: comp.siblingIndex,
    });
  }
}

export function applyHierarchyAndOrder(_data: any, ctx: any) {
  const list: any[] = ctx.payload.importComponents || [];
  const byParent = new Map<string | null, any[]>();

  for (const c of list) {
    const p = c.parentId ?? null;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(c);
  }

  // Sort each sibling group by siblingIndex
  for (const [parentId, group] of byParent) {
    group.sort((a, b) => (a.siblingIndex || 0) - (b.siblingIndex || 0));
    const parentEl = parentId
      ? (document.getElementById(parentId) as HTMLElement | null)
      : null;
    const container = parentEl || document.getElementById("rx-canvas");
    if (!container) continue;
    for (const child of group) {
      const el = document.getElementById(child.id) as HTMLElement | null;
      if (!el) continue;
      container.appendChild(el); // appending in order enforces sibling order
    }
  }

  // Notify import completed
  try {
    const correlationId = ctx.payload.importCorrelationId;
    const components = Array.isArray(list) ? list.length : 0;
    if (correlationId) {
      EventRouter.publish(
        "canvas.component.import.completed",
        { correlationId, components },
        ctx.conductor
      );
    }
  } catch {}
}
