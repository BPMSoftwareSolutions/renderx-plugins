import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Selection overlay e2e computed layout", () => {
  test("getComputedStyle reflects node position/defaults after click", async () => {
    // Reset styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const selection: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-selection-plugin/index.js"
    );
    await conductor.mount(selection.sequence, selection.handlers, selection.sequence.id);

    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          const tag = document.getElementById(id) || document.createElement("style");
          tag.id = id;
          tag.textContent = cssText;
          document.head.appendChild(tag);
          ops.push({ type: "upsertStyleTag", id, cssText });
          return txn;
        }),
        update: jest.fn(() => txn),
        commit: jest.fn(() => ops.push({ type: "commit" })),
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });

    const windowAny: any = (global as any).window || ((global as any).window = {});
    windowAny.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

    // Route play() to selection handlers, providing ctx.stageCrew
    jest.spyOn(conductor as any, "play").mockImplementation((_p: string, seqId: string, payload: any) => {
      if (seqId !== "Canvas.component-select-symphony") return;
      const ctx: any = { payload: (conductor as any).__ctxPayload || {}, stageCrew: { beginBeat }, sequence: selection.sequence };
      const res = selection.handlers.handleSelect({ elementId: payload?.elementId, onSelectionChange: payload?.onSelectionChange, position: payload?.position, defaults: payload?.defaults }, ctx);
      (conductor as any).__ctxPayload = { ...(ctx.payload || {}), ...(res || {}) };
      selection.handlers.handleFinalize({ elementId: payload?.elementId, clearSelection: false }, ctx);
    });

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => { created.push({ type, props, children }); return { type, props, children }; },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    } as any;

    const ui: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-comp-button-e2e",
      cssClass: "rx-comp-button-e2e",
      type: "button",
      position: { x: 159, y: 124 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    // Render + click to select
    ui.CanvasPage({ nodes: [node], selectedId: null });
    const { onElementClick } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/handlers/select.js");
    onElementClick(node)({ stopPropagation() {} });

    // Create overlay element and assert computed styles
    const overlayEl = document.createElement("div");
    overlayEl.className = `rx-resize-overlay rx-overlay-${node.id}`;
    document.body.appendChild(overlayEl);

    const cs = getComputedStyle(overlayEl);
    expect(cs.left).toBe("159px");
    expect(cs.top).toBe("124px");
    expect(cs.width).toBe("120px");
    expect(cs.height).toBe("40px");
  });
});

