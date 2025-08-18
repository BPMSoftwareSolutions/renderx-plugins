/**
 * Canvas Component Drag Plugin (callback-first)
 */

export const sequence = {
  id: "Canvas.component-drag-symphony",
  name: "Canvas Component Drag Symphony",
  description: "Drag/move a canvas component with callback updates",
  version: "1.0.0",
  key: "D Minor",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "drag",
      name: "Drag",
      beats: [
        {
          beat: 1,
          event: "canvas:element:drag:start",
          title: "Drag start",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragStart",
        },
        {
          beat: 2,
          event: "canvas:element:moved",
          title: "Element moved",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragMove",
        },
        {
          beat: 3,
          event: "canvas:element:drag:end",
          title: "Drag end",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleDragEnd",
        },
      ],
    },
  ],
  events: {
    triggers: [
      "canvas:element:drag:start",
      "canvas:element:moved",
      "canvas:element:drag:end",
    ],
    emits: [
      "canvas:element:drag:start",
      "canvas:element:moved",
      "canvas:element:drag:end",
    ],
  },
};

export const handlers = {
  handleDragStart: ({ elementId, origin }, ctx) => {
    ctx.logger?.log?.("startDrag", { elementId, origin });
    return { drag: { elementId, origin } };
  },
  handleDragMove: ({ elementId, delta, onDragUpdate }, ctx) => {
    const o = ctx.payload.drag?.origin || { x: 0, y: 0 };
    const position = { x: o.x + (delta?.dx || 0), y: o.y + (delta?.dy || 0) };
    ctx.logger?.log?.("dragMove", { elementId, delta, position });

    // Stage Crew: update element position, batched to next frame
    try {
      let sc = ctx?.stageCrew;
      // Dev instrumentation: log whether stageCrew exists on context (null if absent)
      try {
        ctx.logger?.info?.("🔎 ctx.stageCrew (from context)", sc ?? null);
      } catch {}
      if (!sc) {
        try {
          const mod = require("@communication/StageCrew");
          sc = mod?.getStageCrew?.();
        } catch {}
      }
      if (sc && typeof sc.beginBeat === "function") {
        const correlationId =
          ctx?.correlationId ||
          `mc-${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2, 6)}`;
        sc.beginBeat(correlationId, { handlerName: "dragMove" })
          .update(`#${elementId}`, {
            style: {
              left: `${Math.round(position.x)}px`,
              top: `${Math.round(position.y)}px`,
            },
          })
          .commit({ batch: true });
      }
    } catch {}

    try {
      onDragUpdate?.({ elementId, position });
    } catch {}
    return { elementId, position };
  },
  handleDragEnd: ({ elementId, onDragEnd }, ctx) => {
    ctx.logger?.log?.("endDrag", { elementId });
    try {
      onDragEnd?.({ elementId });
    } catch {}
    return {};
  },
};
