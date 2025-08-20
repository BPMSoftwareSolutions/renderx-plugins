const { TestEnvironment } = require("../../utils/test-helpers");

const { loadRenderXPlugin } = require("../../utils/renderx-plugin-loader");
const dragHandlersModulePath = "plugins/canvas-ui-plugin/handlers/drag.js";

function makeEvent(type, opts = {}) {
  const e = {
    type,
    clientX: opts.clientX ?? 0,
    clientY: opts.clientY ?? 0,
    pointerId: opts.pointerId ?? 1,
    currentTarget: opts.currentTarget,
    target: opts.target || opts.currentTarget,
    stopPropagation: jest.fn(),
    preventDefault: jest.fn(),
  };
  // Stubs for pointer capture APIs if missing
  if (!e.target.setPointerCapture) e.target.setPointerCapture = () => {};
  if (!e.target.releasePointerCapture)
    e.target.releasePointerCapture = () => {};
  return e;
}

describe("Canvas UI drag performance contract", () => {
  let conductor, eventBus, handlers, mod, el;

  beforeEach(async () => {
    // Real conductor shim so plugins can call play
    eventBus = TestEnvironment.createEventBus();
    conductor = TestEnvironment.createMusicalConductor(eventBus);
    global.window = global.window || {};
    global.document = global.document || window.document;
    window.renderxCommunicationSystem = { conductor };

    // Reset DOM head for style tag assertions
    document.head.innerHTML = "";

    // Install a deterministic rAF stub
    const callbacks = [];
    window.__testRafCallbacks = callbacks;
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
      return callbacks.length;
    };
    window.cancelAnimationFrame = () => {};

    // Prepare element and import module under test
    el = document.createElement("div");
    document.body.appendChild(el);

    // StageCrew routing for drag plugin across tests
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
        upsertStyleTag: (id, cssText) => {
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

    // route plays
    window.renderxCommunicationSystem = { conductor };
    jest.spyOn(conductor, "play").mockImplementation((_p, seqId, payload) => {
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

    mod = loadRenderXPlugin(dragHandlersModulePath);
  });

  function flushRaf(times = 1) {
    for (let i = 0; i < times; i++) {
      const cbs = window.__testRafCallbacks.splice(0);
      cbs.forEach((cb) => {
        try {
          cb(performance.now());
        } catch {}
      });
    }
  }

  test("visual transform is applied only on rAF (no immediate style), and updates reflect latest move per frame", async () => {
    const node = { id: "id-1", position: { x: 10, y: 20 }, cssClass: "id-1" };
    el.id = node.id;

    // StageCrew routing for drag plugin
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
        upsertStyleTag: (id, cssText) => {
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

    // route plays
    window.renderxCommunicationSystem = { conductor };
    jest.spyOn(conductor, "play").mockImplementation((_p, seqId, payload) => {
      if (seqId !== "Canvas.component-drag-symphony") return;
      const ctx = {
        payload: conductor.__ctxPayload || {},
        stageCrew: { beginBeat },
        sequence: dragPlugin.sequence,
      };
      const ev = payload?.event;
      if (ev === "canvas:element:drag:start") {
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
    handlers = mod.attachDragHandlers(node);

    // Pointer down starts drag
    handlers.onPointerDown(
      makeEvent("pointerdown", { currentTarget: el, clientX: 0, clientY: 0 })
    );

    // Burst of moves before any rAF flush
    for (let i = 1; i <= 10; i++) {
      handlers.onPointerMove(
        makeEvent("pointermove", {
          currentTarget: el,
          clientX: i * 5,
          clientY: i * 3,
        })
      );
    }

    // No style applied until rAF runs
    expect(el.getAttribute("style") || "").not.toContain("translate3d");

    // Flush one frame -> style should be applied and contain translate3d
    flushRaf(1);
    const styleAfterFirst = el.getAttribute("style") || "";
    expect(styleAfterFirst).toContain("translate3d");

    // Another burst within next frame
    for (let i = 11; i <= 20; i++) {
      handlers.onPointerMove(
        makeEvent("pointermove", {
          currentTarget: el,
          clientX: i * 5,
          clientY: i * 3,
        })
      );
    }
    flushRaf(1);
    const styleAfterSecond = el.getAttribute("style") || "";
    expect(styleAfterSecond).toContain("translate3d");
    expect(styleAfterSecond).not.toEqual(styleAfterFirst);
  });

  test("does not update per-instance CSS or setNodes during drag; commits once on pointerup", async () => {
    // Expose a commit callback to simulate CanvasPage state commit
    window.__rx_canvas_ui__ = window.__rx_canvas_ui__ || {};
    window.__rx_canvas_ui__.commitNodePosition = jest.fn();

    const node = { id: "id-2", position: { x: 0, y: 0 }, cssClass: "id-2" };
    handlers = mod.attachDragHandlers(node);

    // Start drag and move
    handlers.onPointerDown(
      makeEvent("pointerdown", { currentTarget: el, clientX: 0, clientY: 0 })
    );
    for (let i = 1; i <= 5; i++) {
      handlers.onPointerMove(
        makeEvent("pointermove", {
          currentTarget: el,
          clientX: i * 10,
          clientY: i * 10,
        })
      );
    }
    flushRaf(1);

    // During drag, the per-instance style tag should not exist yet
    const tagId = "component-instance-css-" + node.id;
    expect(document.getElementById(tagId)).toBeNull();

    // End drag -> commit should happen once (CSS + callback)
    handlers.onPointerUp(
      makeEvent("pointerup", { currentTarget: el, clientX: 50, clientY: 50 })
    );

    const tag = document.getElementById(tagId);
    expect(tag).not.toBeNull();
    expect(window.__rx_canvas_ui__.commitNodePosition).toHaveBeenCalledTimes(1);
  });

  test("conductor.play counts: start=1, move ≤ frames, end=1", async () => {
    const node = { id: "id-3", position: { x: 0, y: 0 }, cssClass: "id-3" };
    handlers = mod.attachDragHandlers(node);

    const calls = [];
    jest.spyOn(conductor, "play").mockImplementation((p, id, payload) => {
      calls.push({ id, payload });
      return Promise.resolve();
    });

    handlers.onPointerDown(
      makeEvent("pointerdown", { currentTarget: el, clientX: 0, clientY: 0 })
    );

    // 2 frames worth of move bursts
    for (let i = 1; i <= 10; i++) {
      handlers.onPointerMove(
        makeEvent("pointermove", { currentTarget: el, clientX: i, clientY: i })
      );
    }
    flushRaf(1);
    for (let i = 11; i <= 20; i++) {
      handlers.onPointerMove(
        makeEvent("pointermove", { currentTarget: el, clientX: i, clientY: i })
      );
    }
    flushRaf(1);

    handlers.onPointerUp(
      makeEvent("pointerup", { currentTarget: el, clientX: 20, clientY: 20 })
    );

    const startCount = calls.filter(
      (c) =>
        c.id === "Canvas.component-drag-symphony" &&
        c.payload &&
        c.payload.origin
    ).length;
    const moveCount = calls.filter(
      (c) =>
        c.id === "Canvas.component-drag-symphony" &&
        c.payload &&
        c.payload.delta
    ).length;
    const endCount = calls.filter(
      (c) =>
        c.id === "Canvas.component-drag-symphony" &&
        c.payload &&
        (c.payload.end || c.payload.onDragEnd)
    ).length;

    expect(startCount).toBe(1);
    expect(moveCount).toBeLessThanOrEqual(2); // one per rAF frame
    expect(endCount).toBe(1);
  });
});
