import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Drag handler - hover move must not set rx-comp-grabbing", () => {
  test("onPointerMove with buttons=0 keeps rx-comp-draggable and not grabbing", () => {
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    (global as any).window = (global as any).window || {};
    (global as any).window.__rx_drag = {}; // reset drag state
    (global as any).window.React = {
      createElement: (t: any, p: any, ...c: any[]) => ({
        type: t,
        props: p,
        children: c,
      }),
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, np: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(np || {}) },
      }),
    } as any;

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-drag-hover-1",
      cssClass: "rx-drag-hover-1",
      type: "button",
      position: { x: 0, y: 0 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 100, defaultHeight: 30 },
        },
      },
    };
    const el = plugin.renderCanvasNode(node);

    const backing = new Set<string>();
    const domEl: any = {
      classList: {
        add: (c: string) => backing.add(c),
        remove: (c: string) => backing.delete(c),
        contains: (c: string) => backing.has(c),
      },
      style: {},
    };

    // Hover enter should mark draggable
    el.props.onPointerEnter({ currentTarget: domEl, buttons: 0 });
    expect((domEl.classList as any).contains("rx-comp-draggable")).toBe(true);
    expect((domEl.classList as any).contains("rx-comp-grabbing")).toBe(false);

    // Hover move (no active gesture): must not flip to grabbing
    el.props.onPointerMove({
      currentTarget: domEl,
      clientX: 10,
      clientY: 5,
      buttons: 0,
    });
    expect((domEl.classList as any).contains("rx-comp-draggable")).toBe(true);
    expect((domEl.classList as any).contains("rx-comp-grabbing")).toBe(false);
  });
});
