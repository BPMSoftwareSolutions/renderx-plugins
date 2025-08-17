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
    // Provide Prompt Book shim to capture commits
    window.__rx_prompt_book__ = {
      actions: { move: jest.fn() },
      selectors: { positionOf: () => ({ x: 0, y: 0 }) },
    };

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
    expect(window.__rx_prompt_book__.actions.move).toHaveBeenCalledTimes(1);
  });

  test("conductor.play counts: start=1, move ≤ frames, end=1", async () => {
    const node = {
      id: "id-3",
      position: { x: 0, y: 0 },
      cssClass: "id-3",
      component: { metadata: { type: "button", name: "Button" } },
    };
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

describe("Canvas UI drag performance contract (id shape)", () => {
  test("conductor.play only uses sequence id (no phase id)", async () => {
    // Local setup to avoid relying on outer describe
    const localBus = TestEnvironment.createEventBus();
    const localConductor = TestEnvironment.createMusicalConductor(localBus);
    global.window = global.window || {};
    global.document = global.document || window.document;
    window.renderxCommunicationSystem = { conductor: localConductor };

    const localEl = document.createElement("div");
    document.body.appendChild(localEl);
    const callbacks = [];
    window.__testRafCallbacks = callbacks;
    window.requestAnimationFrame = (cb) => {
      callbacks.push(cb);
      return callbacks.length;
    };

    const localMod = loadRenderXPlugin(dragHandlersModulePath);
    const node = { id: "id-4", position: { x: 0, y: 0 }, cssClass: "id-4" };
    const localHandlers = localMod.attachDragHandlers(node);

    const calls = [];
    jest
      .spyOn(localConductor, "play")
      .mockImplementation((channel, id, payload) => {
        let mod;

        calls.push({ channel, id, payload });
        return Promise.resolve();
      });

    // Start drag
    localHandlers.onPointerDown(
      makeEvent("pointerdown", {
        currentTarget: localEl,
        clientX: 0,
        clientY: 0,
      })
    );
    // Move a bit and flush a frame
    localHandlers.onPointerMove(
      makeEvent("pointermove", {
        currentTarget: localEl,
        clientX: 10,
        clientY: 5,
      })
    );
    // Local flush (avoid depending on outer describe helper)
    const localFlush = (times = 1) => {
      for (let i = 0; i < times; i++) {
        const cbs = window.__testRafCallbacks.splice(0);
        cbs.forEach((cb) => cb(performance.now()));
      }
    };
    localFlush(1);
    // End
    localHandlers.onPointerUp(
      makeEvent("pointerup", {
        currentTarget: localEl,
        clientX: 10,
        clientY: 5,
      })
    );

    // Allow async binder fallback to resolve
    await Promise.resolve();
    // Assert: every call uses the sequence id as id (not 'start'/'update'/'end')
    expect(calls.length).toBeGreaterThanOrEqual(2); // start + end at minimum
    for (const c of calls) {
      expect(c.id).toBe("Canvas.component-drag-symphony");
    }
  });
});

test("drag uses CapabilityBinder-resolved plugin id (default)", async () => {
  // Local setup
  const localBus = TestEnvironment.createEventBus();
  const localConductor = TestEnvironment.createMusicalConductor(localBus);
  global.window = global.window || {};
  global.document = global.document || window.document;
  window.renderxCommunicationSystem = { conductor: localConductor };

  const localEl = document.createElement("div");
  document.body.appendChild(localEl);

  const localMod = loadRenderXPlugin(dragHandlersModulePath);
  const node = {
    id: "id-binder-1",
    position: { x: 0, y: 0 },
    cssClass: "id-binder-1",
    component: { metadata: { type: "button", name: "Button" } },
  };
  const localHandlers = localMod.attachDragHandlers(node);

  const calls = [];
  jest
    .spyOn(localConductor, "play")
    .mockImplementation((channel, id, payload) => {
      calls.push({ channel, id, payload });
      return Promise.resolve();
    });

  localHandlers.onPointerDown(
    makeEvent("pointerdown", { currentTarget: localEl, clientX: 0, clientY: 0 })
  );
  localHandlers.onPointerMove(
    makeEvent("pointermove", { currentTarget: localEl, clientX: 5, clientY: 5 })
  );
  // Flush one frame
  const cbs = window.__testRafCallbacks.splice(0);
  cbs.forEach((cb) => cb(performance.now()));

  localHandlers.onPointerUp(
    makeEvent("pointerup", { currentTarget: localEl, clientX: 5, clientY: 5 })
  );

  // Expect at least start and end and that id equals defaults for button.drag
  const ids = calls.map((c) => c.id);
  expect(ids.every((x) => x === "Canvas.component-drag-symphony")).toBe(true);
});
