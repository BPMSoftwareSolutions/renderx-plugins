import {
  resolveInteraction,
  isFlagEnabled,
  EventRouter,
} from "@renderx/host-sdk";

// Lazily cached route for drag move to avoid resolving on every pointer move
let __dragMoveRoute: { pluginId: string; sequenceId: string } | null = null;

export async function onDropForTest(
  e: any,
  conductor: any,
  onCreated?: (n: any) => void
) {
  e.preventDefault();
  const raw = e.dataTransfer.getData("application/rx-component");
  const payload = raw ? JSON.parse(raw) : {};
  const canvasRect = e.currentTarget.getBoundingClientRect();
  const targetEl: HTMLElement | null = e.target as any;
  const targetRect = targetEl?.getBoundingClientRect?.();
  const isContainer = !!(
    targetEl && (targetEl as any).dataset?.role === "container"
  );
  const containerId = isContainer ? targetEl!.id : undefined;
  const baseLeft = isContainer
    ? targetRect?.left || canvasRect.left
    : canvasRect.left;
  const baseTop = isContainer
    ? targetRect?.top || canvasRect.top
    : canvasRect.top;
  const position = { x: e.clientX - baseLeft, y: e.clientY - baseTop };

  // Define drag callbacks that use conductor.play
  const onDragStart = (dragData: any) => {
    (globalThis as any).__cpDragInProgress = true;

    // Publish drag start notification (no routing; subscribers may listen)
    try {
      EventRouter.publish(
        "canvas.component.drag.start",
        { id: dragData?.id, correlationId: dragData?.correlationId },
        conductor
      );
    } catch {}

    // Debug logs gated for perf
    if (isFlagEnabled("perf.cp.debug")) {
      console.log("Drag started:", dragData);
    }

    // Pre-warm caches and style hints moved to stage-crew handlers
    // This will be handled via canvas.component.drag.start sequence
  };

  const onDragMove = (dragData: any) => {
    // Publish drag move as a topic (throttled by EventRouter perf config)
    try {
      EventRouter.publish(
        "canvas.component.drag.move",
        {
          event: "canvas:component:drag:move",
          ...dragData,
        },
        conductor
      );
    } catch {
      // Fallback to direct interaction routing if EventRouter is unavailable
      try {
        if (!__dragMoveRoute) {
          __dragMoveRoute = resolveInteraction("canvas.component.drag.move");
        }
        const r = __dragMoveRoute;
        conductor?.play?.(r.pluginId, r.sequenceId, {
          event: "canvas:component:drag:move",
          ...dragData,
        });
      } catch {
        throw new Error("Unknown interaction key: canvas.component.drag.move");
      }
    }
  };

  const onDragEnd = (dragData: any) => {
    (globalThis as any).__cpDragInProgress = false;

    // Debug logs gated for perf
    if (isFlagEnabled("perf.cp.debug")) {
      console.log("Drag ended:", dragData);
    }

    // Publish drag end notification (no routing; subscribers may react)
    try {
      const { id, position, correlationId } = dragData || {};
      EventRouter.publish(
        "canvas.component.drag.end",
        { id, position, correlationId },
        conductor
      );
    } catch {}

    // Optionally trigger a deferred Control Panel render after drag ends
    const perf = (globalThis as any).__cpPerf || {};
    let deferMs = 0;
    try {
      // Prefer centralized flag
      if (isFlagEnabled("perf.cp.render.dedupe")) {
        // Still using global numeric until JSON carries values, to avoid schema change
        const ms = Number(perf.postDragRenderDelayMs);
        if (Number.isFinite(ms) && ms > 0) deferMs = ms;
      }
    } catch {}

    if (deferMs > 0 && (globalThis as any).__cpTriggerRender) {
      setTimeout(() => {
        try {
          (globalThis as any).__cpTriggerRender();
        } catch {
          // Silently ignore deferred render failures
        }
      }, deferMs);
    }
  };

  const onSelected = (selectionData: any) => {
    // Use conductor to handle selection
    const r = resolveInteraction("canvas.component.select");
    conductor?.play?.(r.pluginId, r.sequenceId, {
      ...selectionData,
    });
  };

  try {
    const topicKey = isContainer
      ? "library.container.drop.requested"
      : "library.component.drop.requested";

    try {
      EventRouter.publish(
        topicKey,
        {
          component: payload.component,
          position,
          containerId,
          onComponentCreated: onCreated,
          onDragStart,
          onDragMove,
          onDragEnd,
          onSelected,
        },
        conductor
      );
    } catch {
      // Fallback to direct interaction routing
      const routeKey = isContainer
        ? "library.container.drop"
        : "library.component.drop";
      const r = resolveInteraction(routeKey);
      conductor?.play?.(r.pluginId, r.sequenceId, {
        component: payload.component,
        position,
        containerId,
        onComponentCreated: onCreated,
        onDragStart,
        onDragMove,
        onDragEnd,
        onSelected,
      });
    }
  } catch {
    const routeKey = isContainer
      ? "library.container.drop"
      : "library.component.drop";
    const r = resolveInteraction(routeKey);
    conductor?.play?.(r.pluginId, r.sequenceId, {
      component: payload.component,
      position,
      containerId,
      onComponentCreated: onCreated,
      onDragStart,
      onDragMove,
      onDragEnd,
      onSelected,
    });
  }
}
