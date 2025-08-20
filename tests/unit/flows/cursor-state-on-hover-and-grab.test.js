const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");

describe("Cursor policy: open hand on hover, closed fist on grab", () => {
  test("hover adds rx-comp-draggable; mousedown swaps to rx-comp-grabbing; mouseup restores", () => {
    // Reset head styles
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Stub React
    global.window = global.window || {};
    const created = [];
    window.React = {
      createElement: (type, props, ...children) => ({ type, props, children }),
      useEffect: (fn) => fn(),
      useState: (init) => [init, () => {}],
      cloneElement: (el, p) => ({
        ...el,
        props: { ...(el.props || {}), ...(p || {}) },
      }),
    };

    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-cursor-1",
      cssClass: "rx-cursor-1",
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

    // Wire conductor + StageCrew transform of hover/drag via canvas-drag-plugin
    const { TestEnvironment } = require("../../utils/test-helpers");
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus);
    const dragPlugin = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-drag-plugin/index.js"
    );
    const beginBeat = (corrId, meta) => {
      const txn = {
        update: (selector, payload) => {
          try {
            let elem = null;
            if (selector && selector.startsWith("#")) {
              const id = selector.slice(1);
              elem =
                document.getElementById(id) ||
                (window.__rx_drag &&
                  window.__rx_drag[id] &&
                  window.__rx_drag[id].el) ||
                null;
            }
            if (elem) {
              if (payload?.classes?.add)
                payload.classes.add.forEach((c) => elem.classList.add(c));
              if (payload?.classes?.remove)
                payload.classes.remove.forEach((c) => elem.classList.remove(c));
              if (payload?.style)
                Object.entries(payload.style).forEach(([k, v]) => {
                  elem.style[k] = v;
                });
            }
          } catch {}
          return txn;
        },
        commit: () => {},
      };
      return txn;
    };
    window.renderxCommunicationSystem = { conductor };
    conductor.play = jest.fn((_p, seqId, payload) => {
      if (seqId !== "Canvas.component-drag-symphony") return;
      const ctx = {
        payload: conductor.__ctxPayload || {},
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
        conductor.__ctxPayload = { ...(ctx.payload || {}), ...(res || {}) };
      } else if (ev === "canvas:element:moved") {
        const res = dragPlugin.handlers.handleDragMove(
          { elementId: payload.elementId, delta: payload.delta },
          { ...ctx, payload: conductor.__ctxPayload || {} }
        );
        conductor.__ctxPayload = {
          ...(conductor.__ctxPayload || {}),
          ...(res || {}),
        };
      } else if (ev === "canvas:element:drag:end") {
        dragPlugin.handlers.handleDragEnd(
          {
            elementId: payload.elementId,
            position: payload.position,
            instanceClass: payload.instanceClass,
          },
          { ...ctx, payload: conductor.__ctxPayload || {} }
        );
      }
    });

    const domEl = document.createElement("div");
    domEl.id = node.id;
    document.body.appendChild(domEl);
    // Hover enter (handled by StageCrew via handlers)
    el.props.onPointerEnter({ currentTarget: domEl });
    expect(domEl.classList.contains("rx-comp-draggable")).toBe(true);
    expect(domEl.classList.contains("rx-comp-grabbing")).toBe(false);

    // Grab (pointerdown)
    el.props.onPointerDown({
      currentTarget: domEl,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      target: { setPointerCapture() {} },
      stopPropagation() {},
    });
    expect(domEl.classList.contains("rx-comp-grabbing")).toBe(true);
    expect(domEl.classList.contains("rx-comp-draggable")).toBe(false);

    // Release (pointerup)
    el.props.onPointerUp({
      currentTarget: domEl,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      target: { releasePointerCapture() {} },
    });
    expect(domEl.classList.contains("rx-comp-grabbing")).toBe(false);
    // Draggable class is re-added on hover or maintained if still hovered
    // Ensure styles injected exist
    const cursorGlobal = document.getElementById("rx-canvas-ui-cursors");
    expect(cursorGlobal).not.toBeNull();
  });
});
