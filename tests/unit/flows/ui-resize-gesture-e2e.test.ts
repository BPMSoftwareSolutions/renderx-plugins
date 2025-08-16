import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Failing test capturing the missing UI wiring for resize pointermove/up
 * (mirrors the log where start fires but no move/end deltas are produced).
 */
describe("Canvas UI - resize gesture should update overlay and commit size (E2E)", () => {
  test("pointerdown + pointermove on a resize handle should update overlay dimensions (currently missing handler)", async () => {
    // Reset head styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Conductor with resize plugin mounted
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin("RenderX/public/plugins/canvas-resize-plugin/index.js");
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);

    // Expose conductor
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor } as any;

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

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-resize-e2e-1",
      cssClass: "rx-resize-e2e-1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    // Render CanvasPage with selection so overlay exists
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find overlay and southeast handle
    const overlay = created.find(
      (e) => e.type === "div" && typeof e.props?.className === "string" && e.props.className.includes("rx-resize-overlay")
    );
    expect(overlay).toBeTruthy();
    const handle = (overlay.children || []).find((c: any) => /rx-se/.test(String(c.props?.className || "")));
    expect(handle).toBeTruthy();

    // Expect pointermove/up handlers to exist for resize gesture (currently they do not)
    expect(typeof handle.props.onPointerDown).toBe("function");
    expect(typeof handle.props.onPointerMove).toBe("function"); // <-- should fail now
    expect(typeof handle.props.onPointerUp).toBe("function"); // <-- should fail now

    // If they existed, we would simulate a move and expect overlay width/height to change
    // handle.props.onPointerDown({ clientX: 0, clientY: 0, stopPropagation() {} });
    // handle.props.onPointerMove({ clientX: 20, clientY: 10 });
    // const overlayTag = document.getElementById(`overlay-css-${node.id}`) as HTMLStyleElement | null;
    // const css = (overlayTag?.textContent || "").replace(/\s+/g, "");
    // expect(css).toContain(`.rx-overlay-${node.id}{`.replace(/\s+/g, ""));
    // expect(css).toContain(`width:`); // would reflect updated width
  });
});

