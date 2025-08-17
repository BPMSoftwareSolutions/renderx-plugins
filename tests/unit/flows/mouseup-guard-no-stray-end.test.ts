import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Canvas UI - mouseup guard prevents stray end plays", () => {
  test("onWindowMouseUp emits end only when a drag is active and includes elementId", async () => {
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
    (global as any).window = (global as any).window || {};
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }),
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({ ...el, props: { ...(el.props || {}), ...(newProps || {}) } }),
    };
    (global as any).window.React = ReactStub as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-guard-1",
      cssClass: "rx-guard-1",
      type: "button",
      position: { x: 0, y: 0 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>' },
        integration: { canvasIntegration: { defaultWidth: 90, defaultHeight: 28 } },
      },
    };

    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const calls: any[] = [];
    const w: any = (global as any).window;
    const conductor = (w.renderxCommunicationSystem = w.renderxCommunicationSystem || { conductor: { play: () => Promise.resolve() } }).conductor;
    jest.spyOn(conductor, "play").mockImplementation((channel: any, id: any, payload: any) => {
      calls.push({ channel, id, payload });
      return Promise.resolve();
    });

    // Mouseup with no active drag -> no drag play
    w.__rx_canvas_ui__?.onWindowMouseUp?.();
    expect(calls.filter((c) => c.id === "Canvas.component-drag-symphony").length).toBe(0);

    // Start a drag -> set active id
    w.__rx_canvas_ui__ = w.__rx_canvas_ui__ || {};
    w.__rx_canvas_ui__.__activeDragId = node.id;

    // Mouseup now should emit drag end with elementId
    w.__rx_canvas_ui__?.onWindowMouseUp?.();
    const dragEnds = calls.filter((c) => c.id === "Canvas.component-drag-symphony");
    expect(dragEnds.length).toBe(1);
    expect(dragEnds[0].payload.elementId).toBe(node.id);
  });
});

