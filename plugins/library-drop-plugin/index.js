/**
 * Library Drop Plugin for RenderX
 * Handles drop operation from the Element Library to the Canvas
 */

export const sequence = {
  id: "Library.component-drop-symphony",
  name: "Canvas Library Drop Symphony No. 33",
  description:
    "Handles library element drop onto the canvas and forwards to canvas create",
  version: "1.0.0",
  key: "G Major",
  tempo: 120,
  timeSignature: "3/4",
  category: "ui-interactions",
  movements: [
    {
      id: "library-drop",
      name: "Library Drop Movement",
      description: "Handle dragover/leave/drop and forward create",
      beats: [
        {
          beat: 1,
          event: "library:drop:start",
          title: "Drop Start",
          handler: "handleDropStart",
          dynamics: "mezzo-forte",
          timing: "immediate",
        },
        {
          beat: 2,
          event: "library:drop:create",
          title: "Forward to Canvas Create",
          handler: "forwardToCanvasCreate",
          dynamics: "forte",
          timing: "immediate",
        },
        {
          beat: 3,
          event: "library:drop:complete",
          title: "Drop Complete",
          handler: "handleDropComplete",
          dynamics: "piano",
          timing: "immediate",
        },
      ],
    },
  ],
  events: {
    triggers: ["library:drop:start"],
    emits: [
      "library:drop:start",
      "library:drop:create",
      "library:drop:complete",
      "canvas:component:create",
    ],
  },
  configuration: {},
};

export const handlers = {
  handleDropStart: (data, context) => {
    // Prefer payload from data (what conductor.play was called with)
    const coordinates = data?.coordinates ?? context?.coordinates;
    const dragData = data?.dragData ?? context?.dragData;
    const component = dragData?.componentData || dragData?.component || null;

    context.logger?.info?.("📚 Library.drop:start", {
      at: coordinates,
      name: component?.metadata?.name,
      type: component?.metadata?.type,
    });
    return { component, coordinates };
  },

  forwardToCanvasCreate: async (data, context) => {
    const { component, coordinates } = context.payload;
    const onComponentCreated =
      data?.onComponentCreated || context?.onComponentCreated;

    context.logger?.info?.(
      "🎯 Forwarding to Canvas.component-create-symphony",
      {
        name: component?.metadata?.name,
        type: component?.metadata?.type,
        coordinates,
      }
    );

    // Preferred path: use conductor.play so callbacks are preserved
    try {
      if (context?.conductor?.play) {
        const result = await context.conductor.play(
          "Canvas.component-create-symphony",
          "Canvas.component-create-symphony",
          {
            component,
            position: coordinates,
            source: "library-drop",
            onComponentCreated,
          }
        );
        return { forwarded: true, via: "conductor.play", result };
      }
    } catch (err) {
      context.logger?.warn?.(
        "⚠️ Forward to Canvas symphony failed; falling back",
        err?.message || err
      );
    }

    // Fallback: perform local creation and invoke callback directly
    try {
      const type = (component?.metadata?.type || "comp").toLowerCase();
      const id = `rx-comp-${type}-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const cssClass = id;

      context.logger?.info?.("🧩 Local create fallback", {
        id,
        type,
        coordinates,
      });
      if (typeof onComponentCreated === "function") {
        onComponentCreated({
          id,
          cssClass,
          type,
          position: coordinates,
          component,
        });
      }
      return { forwarded: false, created: true, id, cssClass, type };
    } catch (e) {
      context.logger?.error?.(
        "❌ Local create fallback failed",
        e?.message || e
      );
      return { forwarded: false, created: false };
    }
  },

  handleDropComplete: (data, context) => {
    context.logger?.info?.("✅ Library.drop:complete");
    return { completed: true };
  },
};
