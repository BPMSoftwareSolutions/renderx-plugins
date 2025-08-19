import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Drag handler - hover move must not set rx-comp-grabbing", () => {
  test("onPointerMove with buttons=0 keeps rx-comp-draggable and not grabbing", () => {
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    (global as any).window = (global as any).window || {};
    (global as any).window.__rx_drag = {}; // reset drag state
    (global as any).window.React = {
      createElement: (t: any, p: any, ...c: any[]) => ({
        type: t,
        props: p,
        children: c,
      }),
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, np: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(np || {}) },
      }),
    } as any;

    const dragPlugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-drag-plugin/index.js"
    );
    const beginBeat = (corrId: string, meta: any) => {
      const txn: any = {
        update: (selector: string, payload: any) => {
          try {
            let el: any = null;
            if (selector && selector.startsWith("#")) {
              const id = selector.slice(1);
              el =
                document.getElementById(id) ||
                ((window as any).__rx_drag &&
                  (window as any).__rx_drag[id] &&
                  (window as any).__rx_drag[id].el) ||
                null;
            }
            if (el) {
              if (payload?.classes?.add)
                payload.classes.add.forEach((c: string) => el.classList.add(c));
              if (payload?.classes?.remove)
                payload.classes.remove.forEach((c: string) =>
                  el.classList.remove(c)
                );
              if (payload?.style)
                Object.entries(payload.style).forEach(([k, v]) => {
                  el.style[k] = v as any;
                });
            }
          } catch {}
          return txn;
        },
        upsertStyleTag: (id: string, cssText: string) => {
          try {
            let tag = document.getElementById(id);
            if (!tag) {
              tag = document.createElement("style");
              tag.id = id;
              document.head.appendChild(tag);
            }
            tag.textContent = String(cssText || "");
          } catch {}
          return txn;
        },
        commit: () => {},
      };
      return txn;
    };

    (window as any).renderxCommunicationSystem = { conductor: {} } as any;
    (window as any).renderxCommunicationSystem.conductor.play = jest.fn(
      (_pluginId: string, seqId: string, payload: any) => {
        if (seqId !== "Canvas.component-drag-symphony") return;
        const ctx: any = {
          payload: (window as any).__ctxPayload || {},
          stageCrew: { beginBeat },
          sequence: dragPlugin.sequence,
        };
        const ev = payload?.event;
        if (ev === "canvas:element:hover:enter") {
          dragPlugin.handlers.handleHoverEnter(
            { elementId: payload.elementId },
            ctx
          );
        } else if (ev === "canvas:element:hover:leave") {
          dragPlugin.handlers.handleHoverLeave(
            { elementId: payload.elementId },
            ctx
          );
        } else if (ev === "canvas:element:drag:start") {
          const res = dragPlugin.handlers.handleDragStart(
            { elementId: payload.elementId, origin: payload.origin },
            ctx
          );
          (window as any).__ctxPayload = {
            ...(ctx.payload || {}),
            ...(res || {}),
          };
        } else if (ev === "canvas:element:moved") {
          const res = dragPlugin.handlers.handleDragMove(
            { elementId: payload.elementId, delta: payload.delta },
            { ...ctx, payload: (window as any).__ctxPayload || {} }
          );
          (window as any).__ctxPayload = {
            ...((window as any).__ctxPayload || {}),
            ...(res || {}),
          };
        } else if (ev === "canvas:element:drag:end") {
          dragPlugin.handlers.handleDragEnd(
            {
              elementId: payload.elementId,
              position: payload.position,
              instanceClass: payload.instanceClass,
            },
            { ...ctx, payload: (window as any).__ctxPayload || {} }
          );
        }
      }
    );

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-drag-hover-1",
      cssClass: "rx-drag-hover-1",
      type: "button",
      position: { x: 0, y: 0 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 100, defaultHeight: 30 },
        },
      },
    };
    const el = plugin.renderCanvasNode(node);

    const domEl: any = document.createElement("div");

    // Ensure StageCrew selector can resolve element by #id and retain currentTarget fallback
    (domEl as any).id = node.id;
    document.body.appendChild(domEl as unknown as Node);

    // Hover enter should mark draggable
    el.props.onPointerEnter({ currentTarget: domEl, buttons: 0 });
    expect((domEl.classList as any).contains("rx-comp-draggable")).toBe(true);
    expect((domEl.classList as any).contains("rx-comp-grabbing")).toBe(false);

    // Hover move (no active gesture): must not flip to grabbing
    el.props.onPointerMove({
      currentTarget: domEl,
      clientX: 10,
      clientY: 5,
      buttons: 0,
    });
    expect((domEl.classList as any).contains("rx-comp-draggable")).toBe(true);
    expect((domEl.classList as any).contains("rx-comp-grabbing")).toBe(false);
  });
});
