import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Canvas UI Overlay - pointer capture on resize handles", () => {
  test("onPointerDown should call setPointerCapture and onPointerUp should call releasePointerCapture", async () => {
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    const plays: any[] = [];
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = {
      conductor: { play: (_a: any, _b: any, payload: any) => plays.push(payload) },
    } as any;

    const created: any[] = [];
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({ ...el, props: { ...(el.props || {}), ...(newProps || {}) } }),
    };
    (global as any).window.React = ReactStub as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-capture-1",
      cssClass: "rx-comp-button-abc123",
      type: "button",
      position: { x: 5, y: 7 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    };

    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const overlay = created.find((e) => e.type === "div" && String(e.props?.className || "").includes("rx-resize-overlay"));
    const handle = (overlay?.children || []).find((c: any) => /rx-se/.test(String(c.props?.className || "")));
    expect(handle).toBeTruthy();

    const downEvt: any = {
      clientX: 0,
      clientY: 0,
      pointerId: 42,
      stopPropagation() {},
      target: { setPointerCapture: jest.fn(), releasePointerCapture: jest.fn() },
    };
    const upEvt: any = { clientX: 10, clientY: 10, pointerId: 42, target: downEvt.target };

    await handle.props.onPointerDown(downEvt);
    await handle.props.onPointerUp(upEvt);

    // Failing expectation (currently, overlay does not call setPointerCapture/releasePointerCapture)
    expect(downEvt.target.setPointerCapture).toHaveBeenCalledWith(42);
    expect(downEvt.target.releasePointerCapture).toHaveBeenCalledWith(42);
  });
});

