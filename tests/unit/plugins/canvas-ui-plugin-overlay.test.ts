import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Canvas UI Plugin - selection overlay and resize handles", () => {
  test("CanvasPage renders overlay with 8 handles, no inline styles; CSS injected (global + per-instance)", async () => {
    // Reset head
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Conductor with resize plugin mounted (for later interactions)
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-resize-plugin/index.js"
    );
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);

    // Expose conductor
    (global as any).window = (global as any).window || {};
    // Install StageCrew recorder and expose through renderxCommunicationSystem
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          ops.push({ type: "upsertStyleTag", id, cssText });
          return txn;
        }),
        commit: jest.fn((options?: any) => {
          ops.push({ type: "commit", options });
          return undefined;
        }),
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });
    (global as any).window.renderxCommunicationSystem = {
      conductor,
      stageCrew: { beginBeat },
      __ops: ops,
    } as any;

    // Mount selection plugin and route play() to handlers so ctx.stageCrew is passed
    const selection: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-selection-plugin/index.js"
    );
    await conductor.mount(
      selection.sequence,
      selection.handlers,
      selection.sequence.id
    );
    jest
      .spyOn(conductor as any, "play")
      .mockImplementation((_p: string, seqId: string, payload: any) => {
        if (seqId !== "Canvas.component-select-symphony") return;
        const ctx: any = {
          payload: (conductor as any).__ctxPayload || {},
          stageCrew: { beginBeat },
          sequence: selection.sequence,
        };
        const res = selection.handlers.handleSelect(
          {
            elementId: payload?.elementId,
            onSelectionChange: payload?.onSelectionChange,
            position: payload?.position,
            defaults: payload?.defaults,
          },
          ctx
        );
        (conductor as any).__ctxPayload = {
          ...(ctx.payload || {}),
          ...(res || {}),
        };
        selection.handlers.handleFinalize(
          { elementId: payload?.elementId, clearSelection: false },
          ctx
        );
      });

    // React stub
    const created: any[] = [];
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    };
    (global as any).window.React = ReactStub as any;

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-comp-button-ov1",
      cssClass: "rx-comp-button-ov1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">{{content}}</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
        },
      },
    };

    // Render CanvasPage with nodes + selectedId overrides
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: null });

    // Click to trigger selection symphony which ensures overlay via handlers
    const { onElementClick } = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/handlers/select.js"
    );
    const click = onElementClick(node);
    click({ stopPropagation() {} });

    // Simulate re-render with selectedId applied by UI state
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find overlay element (it is rendered as a child of the selected node)
    const overlay =
      created.find(
        (e) =>
          e.type === "div" &&
          typeof e.props?.className === "string" &&
          e.props.className.includes("rx-resize-overlay")
      ) ||
      created
        .flatMap((e) => e.children || [])
        .find(
          (e: any) =>
            e?.type === "div" &&
            typeof e?.props?.className === "string" &&
            e.props.className.includes("rx-resize-overlay")
        );
    expect(overlay).toBeTruthy();

    // No inline style on overlay
    expect(
      overlay.props?.style == null ||
        Object.keys(overlay.props?.style || {}).length === 0
    ).toBe(true);

    // Children contain 8 handles
    const handles = overlay.children.filter(
      (c: any) =>
        c?.type === "div" &&
        /rx-resize-handle/.test(String(c.props?.className || ""))
    );
    expect(handles.length).toBe(8);
    const names = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    names.forEach((n) =>
      expect(
        handles.some((h: any) =>
          String(h.props?.className || "").includes(`rx-${n}`)
        )
      ).toBe(true)
    );

    // CSS: verify StageCrew recorded upsertStyleTag calls for global + instance
    const opsArr = (global as any).window.renderxCommunicationSystem
      .__ops as any[];
    const globalUpsert = opsArr.find(
      (o) => o.type === "upsertStyleTag" && o.id === "overlay-css-global"
    );
    expect(globalUpsert).toBeTruthy();
    expect(globalUpsert.cssText).toMatch(/\.rx-resize-overlay\b/);
    expect(globalUpsert.cssText).toMatch(/\.rx-resize-handle\b/);

    const instUpsert = opsArr.find(
      (o) => o.type === "upsertStyleTag" && o.id === `overlay-css-${node.id}`
    );
    expect(instUpsert).toBeTruthy();
    expect(instUpsert.cssText.replace(/\s+/g, "")).toContain(
      `.rx-overlay-${node.id}{position:absolute;left:10px;top:20px;width:120px;height:40px;z-index:10;}`.replace(
        /\s+/g,
        ""
      )
    );
  });

  test("Pointerdown on a handle plays Canvas.component-resize-symphony", async () => {
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-resize-plugin/index.js"
    );
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor } as any;

    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    };

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-comp-button-ov2",
      cssClass: "rx-comp-button-ov2",
      type: "button",
      position: { x: 2, y: 3 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">{{content}}</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 100, defaultHeight: 30 },
        },
      },
    };

    // Render page for overlay
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find a handle and simulate pointerdown
    const overlay = created.find(
      (e) =>
        e.type === "div" &&
        typeof e.props?.className === "string" &&
        e.props.className.includes("rx-resize-overlay")
    );
    const handle = (overlay.children || []).find((c: any) =>
      /rx-se/.test(String(c.props?.className || ""))
    );
    expect(typeof handle?.props?.onPointerDown).toBe("function");

    const logs: string[] = [];
    const orig = console.log;
    console.log = (...args: any[]) => {
      try {
        logs.push(String(args[0]));
      } catch {}
      orig.apply(console, args as any);
    };
    await handle.props.onPointerDown({
      clientX: 10,
      clientY: 20,
      stopPropagation() {},
    });
    await new Promise((r) => setTimeout(r, 30));

    expect(
      logs.some((l) => l.includes("Canvas.component-resize-symphony"))
    ).toBe(true);
  });
});
