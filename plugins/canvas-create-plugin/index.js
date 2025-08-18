/**
 * Canvas Component Create Plugin for RenderX
 * Creates a canvas element with a unique rx-comp-[type]-[hash] id/class
 */

function shortHash() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const sequence = {
  id: "Canvas.component-create-symphony",
  name: "Canvas Component Create Symphony",
  description: "Creates a new canvas component from a dropped library item",
  version: "1.0.0",
  key: "A Minor",
  tempo: 120,
  timeSignature: "4/4",
  category: "ui-interactions",
  movements: [
    {
      id: "component-create",
      name: "Canvas Component Create Movement",
      description: "Generate id/class and notify React to add element",
      beats: [
        {
          beat: 1,
          event: "canvas:component:create",
          title: "Create Component",
          handler: "createCanvasComponent",
          dynamics: "forte",
          timing: "immediate",
        },
      ],
    },
  ],
  events: {
    triggers: ["canvas:component:create"],
    emits: ["canvas:component:created"],
  },
  configuration: {},
};

export const handlers = {
  createCanvasComponent: (data, context) => {
    const component = context?.component || data?.component;
    const position = context?.position || data?.position || { x: 0, y: 0 };

    const type = (component?.metadata?.type || "comp").toLowerCase();
    const id = `rx-comp-${type}-${shortHash()}`;
    const cssClass = id;

    context.logger?.info?.("🧩 Canvas.create", { id, type, position });

    // Stage Crew: initial instance CSS (position etc.)
    try {
      let sc = context?.stageCrew;
      // Dev instrumentation: log whether stageCrew exists on context (null if absent)
      try {
        context.logger?.info?.("🔎 ctx.stageCrew (from context)", sc ?? null);
      } catch {}
      if (!sc) {
        try {
          const mod = require("@communication/StageCrew");
          sc = mod?.getStageCrew?.();
        } catch {}
      }
      if (sc && typeof sc.beginBeat === "function") {
        const correlationId =
          context?.correlationId ||
          `mc-${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2, 6)}`;
        const tagId = `component-instance-css-${id}`;
        const cssText = `.${cssClass}{position:absolute;left:${
          position.x || 0
        }px;top:${position.y || 0}px;box-sizing:border-box;display:block;}`;
        const hasUpsert = typeof sc?.upsertStyle === "function";
        try {
          context.logger?.info?.(
            "🔎 StageCrew.upsertStyle available?",
            hasUpsert
          );
        } catch {}
        const txn = sc.beginBeat(correlationId, { handlerName: "create" });
        const txnHasUpsert = typeof txn?.upsertStyle === "function";
        const txnHasUpdate = typeof txn?.update === "function";
        try {
          context.logger?.info?.("🔎 txn.upsertStyle available?", txnHasUpsert);
        } catch {}
        try {
          context.logger?.info?.("🔎 txn.update available?", txnHasUpdate);
        } catch {}
        try {
          if (txnHasUpsert) {
            txn.upsertStyle(tagId, cssText);
          } else if (txnHasUpdate) {
            txn.update(`#${id}`, {
              style: {
                left: `${position.x || 0}px`,
                top: `${position.y || 0}px`,
              },
            });
          } else {
            context.logger?.warn?.(
              "⚠️ StageCrew txn has neither upsertStyle nor update; skipping commit"
            );
          }
        } catch (e) {
          context.logger?.warn?.(
            "⚠️ StageCrew op failed (create)",
            e?.message || e
          );
        }
        try {
          context.logger?.info?.("🎬 StageCrew.commit about to run (create)", {
            batch: false,
          });
        } catch {}
        try {
          txn.commit();
        } catch (e) {
          context.logger?.warn?.(
            "⚠️ StageCrew commit failed (create)",
            e?.message || e
          );
        }
      }
    } catch {}

    // Notify React Canvas via callback if available
    const onComponentCreated =
      context?.onComponentCreated || data?.onComponentCreated;
    if (typeof onComponentCreated === "function") {
      try {
        onComponentCreated({ id, cssClass, type, position, component });
      } catch (e) {
        context.logger?.warn?.("⚠️ onComponentCreated failed", e?.message);
      }
    }

    // Emit event-style payload for any other listeners
    return { created: true, id, cssClass, type, position };
  },
};
