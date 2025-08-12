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
  handleDragStart: ({ elementId, origin }, ctx) => ({
    drag: { elementId, origin },
  }),
  handleDragMove: ({ elementId, delta, onDragUpdate }, ctx) => {
    const o = ctx.payload.drag?.origin || { x: 0, y: 0 };
    const position = { x: o.x + (delta?.dx || 0), y: o.y + (delta?.dy || 0) };
    try {
      onDragUpdate?.({ elementId, position });
    } catch {}
    return { elementId, position };
  },
  handleDragEnd: ({ onDragEnd }, ctx) => {
    try {
      onDragEnd?.();
    } catch {}
    return {};
  },
};
