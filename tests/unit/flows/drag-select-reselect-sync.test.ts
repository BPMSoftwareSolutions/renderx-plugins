import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

function strip(s: string) {
  return (s || "").replace(/\s+/g, "");
}

describe("Canvas UI - drag → select → reselect keeps element and overlay in sync", () => {
  test("overlay-instance and instance CSS align after reselect", async () => {
    // Reset head styles
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    (global as any).window = (global as any).window || {};
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => ({
        type,
        props,
        children,
      }),
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
      id: "rx-sync-1",
      cssClass: "rx-sync-1",
      type: "button",
      position: { x: 100, y: 40 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 90, defaultHeight: 28 },
        },
      },
    };

    // Initial render with selectedId so overlay is present
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Simulate a drag commit via UI callbacks
    const w: any = (global as any).window;
    w.__rx_canvas_ui__?.onDragStart?.({
      elementId: node.id,
      origin: { x: 0, y: 0 },
    });
    w.__rx_canvas_ui__?.onDragUpdate?.({
      elementId: node.id,
      delta: { dx: 20, dy: 10 },
    });
    w.__rx_canvas_ui__?.onDragEnd?.({
      elementId: node.id,
      position: { x: 120, y: 50 },
    });

    // Commit final position to store + instance CSS (simulates drag commit path)
    w.__rx_canvas_ui__?.commitNodePosition?.({
      elementId: node.id,
      position: { x: 120, y: 50 },
    });

    // Reselect (hide then show selection)
    w.__rx_canvas_ui__?.setSelectedId?.(null);
    w.__rx_canvas_ui__?.setSelectedId?.(node.id);

    // Assert overlay CSS left/top equals 120/50
    const overlayTag = document.getElementById(
      `overlay-css-${node.id}`
    ) as HTMLStyleElement | null;
    expect(overlayTag).toBeTruthy();
    const overlayCss = strip(overlayTag?.textContent || "");
    expect(overlayCss).toContain(
      strip(`.rx-overlay-${node.id}{position:absolute;left:120px;top:50px;`)
    );

    // Assert component instance CSS left/top equals 120/50
    const instTag = document.getElementById(
      `component-instance-css-${node.id}`
    ) as HTMLStyleElement | null;
    expect(instTag).toBeTruthy();
    const instCss = strip(instTag?.textContent || "");
    expect(instCss).toContain(
      strip(`.${node.cssClass}{position:absolute;left:120px;top:50px;`)
    );
  });
});
