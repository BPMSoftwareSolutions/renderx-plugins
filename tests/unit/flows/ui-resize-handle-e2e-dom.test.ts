import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

function strip(s: string) {
  return (s || "").replace(/\s+/g, "");
}

describe("Canvas UI - resize via overlay handle updates overlay + commits instance CSS (SE handle)", () => {
  test("pointerdown/move/up (SE) grows width/height from defaults (120x40) to (140x50)", async () => {
    // Reset head styles
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Conductor with resize plugin mounted
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-resize-plugin/index.js"
    );
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);

    // Expose conductor
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor } as any;

    // React stub that captures created elements
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

    const uiPlugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-resize-se-1",
      cssClass: "rx-resize-se-1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
        },
      },
    };

    // Render with selection so overlay is present
    created.length = 0;
    uiPlugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Initial overlay CSS matches defaults
    const overlayCssId = `overlay-css-${node.id}`;
    let overlayTag = document.getElementById(
      overlayCssId
    ) as HTMLStyleElement | null;
    expect(overlayTag).toBeTruthy();
    expect(strip(overlayTag!.textContent || "")).toContain(
      strip(
        `.rx-overlay-${node.id}{position:absolute;left:10px;top:20px;width:120px;height:40px;z-index:10;}`
      )
    );

    // Find overlay and its SE handle
    const overlay = created.find(
      (e) =>
        e.type === "div" &&
        String(e.props?.className || "").includes("rx-resize-overlay")
    );
    const handle = (overlay?.children || []).find((c: any) =>
      /rx-se/.test(String(c.props?.className || ""))
    );
    expect(handle && typeof handle.props.onPointerDown).toBe("function");
    expect(typeof handle.props.onPointerMove).toBe("function");
    expect(typeof handle.props.onPointerUp).toBe("function");

    // Simulate pointerdown at (0,0), then move by (20,10)
    await handle.props.onPointerDown({
      clientX: 0,
      clientY: 0,
      stopPropagation() {},
      pointerId: 1,
      target: { setPointerCapture() {} },
    });
    await handle.props.onPointerMove({ clientX: 20, clientY: 10, buttons: 1 });
    // Allow rAF/coalescing to flush
    await new Promise((r) => setTimeout(r, 30));

    // Overlay CSS should reflect 140x50 (was 120x40 + 20x10)
    overlayTag = document.getElementById(
      overlayCssId
    ) as HTMLStyleElement | null;
    const overlayCss = strip(overlayTag?.textContent || "");
    expect(overlayCss).toContain(strip(`.rx-overlay-${node.id}{`));
    expect(overlayCss).toContain(strip(`width:140px`));
    expect(overlayCss).toContain(strip(`height:50px`));

    // End -> commit instance size
    await handle.props.onPointerUp({ clientX: 20, clientY: 10 });
    await new Promise((r) => setTimeout(r, 20));

    const instId = `component-instance-css-${node.id}`;
    const instTag = document.getElementById(instId) as HTMLStyleElement | null;
    expect(instTag).toBeTruthy();
    const instCss = strip(instTag?.textContent || "");
    expect(instCss).toContain(strip(`.${node.cssClass}{width:140px;}`));
    expect(instCss).toContain(strip(`.${node.cssClass}{height:50px;}`));
  });
});
