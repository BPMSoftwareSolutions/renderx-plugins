import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Selection overlay computed layout", () => {
  test("overlay per-instance class yields correct computed left/top/width/height", async () => {
    // Reset styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Conductor + selection plugin mounted and play() routed to handlers
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const selection: any = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");
    await conductor.mount(selection.sequence, selection.handlers, selection.sequence.id);

    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          // Real DOM injection for computed styles
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
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

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
      id: "rx-comp-button-emu1",
      cssClass: "rx-comp-button-emu1",
      type: "button",
      position: { x: 159, y: 124 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    // Render, click to select (plays selection symphony), then re-render with selectedId
    created.length = 0;
    ui.CanvasPage({ nodes: [node], selectedId: null });
    const { onElementClick } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/handlers/select.js");
    onElementClick(node)({ stopPropagation() {} });
    ui.CanvasPage({ nodes: [node], selectedId: node.id });

    // Create a simulated overlay element to compute styles against
    const overlayEl = document.createElement("div");
    overlayEl.className = `rx-resize-overlay rx-overlay-${node.id}`;
    document.body.appendChild(overlayEl);

    // Read computed styles applied by injected style tags
    const cs = getComputedStyle(overlayEl);
    expect(cs.left).toBe("159px");
    expect(cs.top).toBe("124px");
    expect(cs.width).toBe("120px");
    expect(cs.height).toBe("40px");
  });
});

