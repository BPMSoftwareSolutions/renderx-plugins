/**
 * Canvas Component Resize Plugin (callback-first)
 */

function applyConstraints(box, constraints) {
  if (!constraints) return box;
  const min = constraints.min || {};
  const max = constraints.max || {};
  const aspect = constraints.aspect;
  let { w, h } = box;
  if (typeof aspect === "number" && aspect > 0) {
    // lock aspect based on the larger change
    const targetH = w / aspect;
    const targetW = h * aspect;
    if (Math.abs(targetH - h) < Math.abs(targetW - w)) {
      h = targetH;
    } else {
      w = targetW;
    }
  }
  if (min.w != null) w = Math.max(min.w, w);
  if (min.h != null) h = Math.max(min.h, h);
  if (max.w != null) w = Math.min(max.w, w);
  if (max.h != null) h = Math.min(max.h, h);
  return { ...box, w, h };
}

function computeResize(startBox, delta, handle) {
  const sx = startBox.x || 0,
    sy = startBox.y || 0,
    sw = startBox.w || 0,
    sh = startBox.h || 0;
  const dx = delta?.dx || 0,
    dy = delta?.dy || 0;
  let x = sx,
    y = sy,
    w = sw,
    h = sh;
  switch ((handle || "").toLowerCase()) {
    case "e":
      w = sw + dx;
      break;
    case "s":
      h = sh + dy;
      break;
    case "se":
      w = sw + dx;
      h = sh + dy;
      break;
    case "w":
      x = sx + dx;
      w = sw - dx;
      break;
    case "n":
      y = sy + dy;
      h = sh - dy;
      break;
    case "nw":
      x = sx + dx;
      w = sw - dx;
      y = sy + dy;
      h = sh - dy;
      break;
    case "ne":
      w = sw + dx;
      y = sy + dy;
      h = sh - dy;
      break;
    case "sw":
      x = sx + dx;
      w = sw - dx;
      h = sh + dy;
      break;
    default:
      break;
  }
  // prevent negatives; constraints will clamp further
  w = Math.max(0, w);
  h = Math.max(0, h);
  return { x, y, w, h };
}

export const sequence = {
  id: "Canvas.component-resize-symphony",
  name: "Canvas Component Resize Symphony",
  description: "Resize a canvas component with callback updates",
  version: "1.0.0",
  key: "E Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "resize",
      name: "Resize",
      beats: [
        {
          beat: 1,
          event: "canvas:element:resize:start",
          title: "Resize start",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleResizeStart",
        },
        {
          beat: 2,
          event: "canvas:element:resized",
          title: "Element resized",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleResizeMove",
        },
        {
          beat: 3,
          event: "canvas:element:resize:end",
          title: "Resize end",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleResizeEnd",
        },
      ],
    },
  ],
  events: {
    triggers: [
      "canvas:element:resize:start",
      "canvas:element:resized",
      "canvas:element:resize:end",
    ],
    emits: [
      "canvas:element:resize:start",
      "canvas:element:resized",
      "canvas:element:resize:end",
    ],
  },
};

export const handlers = {
  handleResizeStart: ({ elementId, handle, start, tools, startBox }, ctx) => ({
    resize: {
      elementId,
      handle,
      start,
      startBox: startBox || { x: 0, y: 0, w: 0, h: 0 },
      constraints: tools?.resize?.constraints,
    },
  }),
  handleResizeMove: (
    { elementId, handle, delta, tools, onResizeUpdate },
    ctx
  ) => {
    const startBox = ctx.payload.resize?.startBox || { x: 0, y: 0, w: 0, h: 0 };
    const constraints =
      ctx.payload.resize?.constraints || tools?.resize?.constraints;
    const box = applyConstraints(
      computeResize(startBox, delta, handle),
      constraints
    );
    try {
      onResizeUpdate?.({ elementId, box });
    } catch {}
    return { elementId, box };
  },
  handleResizeEnd: ({ onResizeEnd }, ctx) => {
    try {
      onResizeEnd?.();
    } catch {}
    return {};
  },
};
