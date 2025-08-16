import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

function strip(s: string) { return (s || "").replace(/\s+/g, ""); }

/**
 * Handle-matrix tests: verifies overlay left/top/width/height per handle.
 * This suite is expected to FAIL for north/west (and corners touching N/W)
 * until UI uses box.x/box.y from onResizeUpdate/onResizeEnd.
 */
describe("Canvas UI - resize handle matrix (overlay + commit)", () => {
  const base = { x: 10, y: 20, w: 120, h: 40 };
  const move = { dx: 20, dy: 10 };

  // Each case defines the handle used and the expected box after applying dx,dy
  const cases: Array<{
    handle: string;
    dx: number;
    dy: number;
    expectBox: { x: number; y: number; w: number; h: number };
  }> = [
    { handle: "e", dx: move.dx, dy: 0, expectBox: { x: base.x, y: base.y, w: base.w + move.dx, h: base.h } },
    { handle: "s", dx: 0, dy: move.dy, expectBox: { x: base.x, y: base.y, w: base.w, h: base.h + move.dy } },
    { handle: "se", dx: move.dx, dy: move.dy, expectBox: { x: base.x, y: base.y, w: base.w + move.dx, h: base.h + move.dy } },
    { handle: "w", dx: move.dx, dy: 0, expectBox: { x: base.x + move.dx, y: base.y, w: base.w - move.dx, h: base.h } },
    { handle: "n", dx: 0, dy: move.dy, expectBox: { x: base.x, y: base.y + move.dy, w: base.w, h: base.h - move.dy } },
    { handle: "ne", dx: move.dx, dy: move.dy, expectBox: { x: base.x, y: base.y + move.dy, w: base.w + move.dx, h: base.h - move.dy } },
    { handle: "sw", dx: move.dx, dy: move.dy, expectBox: { x: base.x + move.dx, y: base.y, w: base.w - move.dx, h: base.h + move.dy } },
    { handle: "nw", dx: move.dx, dy: move.dy, expectBox: { x: base.x + move.dx, y: base.y + move.dy, w: base.w - move.dx, h: base.h - move.dy } },
  ];

  test.each(cases)(
    "handle %s updates overlay and commits instance CSS (expected to fail for N/W until x/y is used)",
    async ({ handle, dx, dy, expectBox }) => {
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

      const uiPlugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

      const node = {
        id: "rx-matrix-1",
        cssClass: "rx-comp-button-matrix1",
        type: "button",
        position: { x: base.x, y: base.y },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
          integration: { canvasIntegration: { defaultWidth: base.w, defaultHeight: base.h } },
        },
      };

      created.length = 0;
      uiPlugin.CanvasPage({ nodes: [node], selectedId: node.id });

      // Initial overlay CSS matches baseline
      const overlayCssId = `overlay-css-${node.id}`;
      let overlayTag = document.getElementById(overlayCssId) as HTMLStyleElement | null;
      expect(overlayTag).toBeTruthy();
      const initialCss = strip(overlayTag!.textContent || "");
      expect(initialCss).toContain(strip(`.rx-overlay-${node.id}{position:absolute;left:${base.x}px;top:${base.y}px;width:${base.w}px;height:${base.h}px;`));

      // Find handle element by direction class
      const overlay = created.find((e) => e.type === "div" && String(e.props?.className || "").includes("rx-resize-overlay"));
      const handleEl = (overlay?.children || []).find((c: any) => new RegExp(`rx-${handle}$`).test(String(c.props?.className || "")));
      expect(handleEl && typeof handleEl.props.onPointerDown).toBe("function");

      // Gesture
      await handleEl.props.onPointerDown({ clientX: 0, clientY: 0, stopPropagation() {}, pointerId: 1, target: { setPointerCapture() {} } });
      await handleEl.props.onPointerMove({ clientX: dx, clientY: dy, buttons: 1 });
      await new Promise((r) => setTimeout(r, 30));

      // Validate overlay reflects expected x/y/w/h
      overlayTag = document.getElementById(overlayCssId) as HTMLStyleElement | null;
      const overlayCss = strip(overlayTag?.textContent || "");
      const expectedOverlayStart = strip(`.rx-overlay-${node.id}{position:absolute;left:${expectBox.x}px;top:${expectBox.y}px;width:${expectBox.w}px;height:${expectBox.h}px;`);
      expect(overlayCss).toContain(expectedOverlayStart);

      // End/commit
      await handleEl.props.onPointerUp({ clientX: dx, clientY: dy, pointerId: 1, target: { releasePointerCapture() {} } });
      await new Promise((r) => setTimeout(r, 20));

      // Instance CSS commit
      const instId = `component-instance-css-${node.id}`;
      const instTag = document.getElementById(instId) as HTMLStyleElement | null;
      expect(instTag).toBeTruthy();
      const instCss = strip(instTag?.textContent || "");
      expect(instCss).toContain(strip(`.${node.cssClass}{width:${expectBox.w}px;}`));
      expect(instCss).toContain(strip(`.${node.cssClass}{height:${expectBox.h}px;}`));
    }
  );
});

