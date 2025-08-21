/**
 * Canvas Overlay Transform Plugin (CIA/SPA Compliant)
 * Handles live overlay transforms during drag operations via StageCrew
 */

export const sequence = {
  id: "Canvas.overlay-transform-symphony",
  name: "Canvas Overlay Transform Symphony",
  description: "Apply live transforms to overlay elements during drag",
  version: "1.0.0",
  key: "F Major",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "transform",
      name: "Transform",
      description: "Apply or clear overlay transforms",
      beats: [
        {
          beat: 1,
          event: "canvas:overlay:transform:apply",
          title: "Apply transform",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleApplyTransform",
        },
        {
          beat: 2,
          event: "canvas:overlay:transform:clear",
          title: "Clear transform",
          dynamics: "mf",
          timing: "immediate",
          errorHandling: "continue",
          handler: "handleClearTransform",
        },
      ],
    },
  ],
  events: {
    triggers: ["canvas:overlay:transform:apply", "canvas:overlay:transform:clear"],
    emits: ["canvas:overlay:transform:apply", "canvas:overlay:transform:clear"],
  },
};

export const handlers = {
  handleApplyTransform: ({ elementId, delta }, ctx) => {
    try {
      if (!elementId || !ctx?.stageCrew) return {};

      const dx = Math.round(delta?.dx || 0);
      const dy = Math.round(delta?.dy || 0);
      const styleId = `overlay-transform-${elementId}`;
      const cssText = `.rx-overlay-${elementId}{transform:translate(${dx}px,${dy}px);}`;

      const txn = ctx.stageCrew.beginBeat(`overlay-transform:${elementId}`, {
        handlerName: "handleApplyTransform",
        plugin: "canvas-overlay-transform-plugin",
        sequenceId: ctx?.sequence?.id,
        nodeId: elementId,
      });

      // Remove existing transform style and create new one
      txn.remove(`#${styleId}`);
      txn.create("style", { attrs: { id: styleId } }).appendTo("head");
      txn.update(`#${styleId}`, { text: cssText });
      txn.commit();

      return { elementId, delta: { dx, dy } };
    } catch (err) {
      try {
        ctx?.logger?.error?.("[handleApplyTransform] failed", err);
      } catch {}
      return {};
    }
  },

  handleClearTransform: ({ elementId }, ctx) => {
    try {
      if (!elementId || !ctx?.stageCrew) return {};

      const styleId = `overlay-transform-${elementId}`;

      const txn = ctx.stageCrew.beginBeat(`overlay-clear:${elementId}`, {
        handlerName: "handleClearTransform",
        plugin: "canvas-overlay-transform-plugin",
        sequenceId: ctx?.sequence?.id,
        nodeId: elementId,
      });

      txn.remove(`#${styleId}`);
      txn.commit();

      return { elementId };
    } catch (err) {
      try {
        ctx?.logger?.error?.("[handleClearTransform] failed", err);
      } catch {}
      return {};
    }
  },
};

export const metadata = {
  id: "canvas-overlay-transform-plugin",
  name: "Canvas Overlay Transform Plugin",
  version: "1.0.0",
  description: "CIA/SPA compliant overlay transform management",
  author: "RenderX Team",
  dependencies: [],
  category: "canvas-interactions",
};
