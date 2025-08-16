import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

function strip(s: string) { return (s || "").replace(/\s+/g, ""); }

describe("Canvas UI - live instance CSS updates during resize (SE handle)", () => {
  test("component-instance-css reflects 140x50 before pointerup", async () => {
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Conductor with resize plugin mounted
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin("RenderX/public/plugins/canvas-resize-plugin/index.js");
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);

    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor } as any;

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

    const uiPlugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-live-1",
      cssClass: "rx-comp-button-live1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    created.length = 0;
    uiPlugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find SE handle
    const overlay = created.find((e) => e.type === "div" && String(e.props?.className || "").includes("rx-resize-overlay"));
    const handle = (overlay?.children || []).find((c: any) => /rx-se$/.test(String(c.props?.className || "")));
    expect(handle).toBeTruthy();

    // Down -> Move (dx=20,dy=10)
    await handle.props.onPointerDown({ clientX: 0, clientY: 0, stopPropagation() {}, pointerId: 1, target: { setPointerCapture() {} } });
    await handle.props.onPointerMove({ clientX: 20, clientY: 10, buttons: 1 });
    await new Promise((r) => setTimeout(r, 30));

    // Assert instance CSS already updated (before up)
    const instId = `component-instance-css-${node.id}`;
    const instTag = document.getElementById(instId) as HTMLStyleElement | null;
    expect(instTag).toBeTruthy();
    const instCss = strip(instTag?.textContent || "");
    expect(instCss).toContain(strip(`.${node.cssClass}{width:140px;}`));
    expect(instCss).toContain(strip(`.${node.cssClass}{height:50px;}`));

    // Up (finalize)
    await handle.props.onPointerUp({ clientX: 20, clientY: 10, pointerId: 1, target: { releasePointerCapture() {} } });
  });
});

