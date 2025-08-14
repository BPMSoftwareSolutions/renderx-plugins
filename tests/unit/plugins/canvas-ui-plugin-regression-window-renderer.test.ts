import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Canvas UI Regression: CanvasPage should not rely on window.renderCanvasNode", () => {
  test("drop -> onComponentCreated appends node and renderCanvasNode import is used", () => {
    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const created: Array<{ type: any; props: any; children: any[] }> = [];

    const original: any = (global as any).window;
    const w: any = original || {};

    const play = jest.fn();
    w.renderxCommunicationSystem = { conductor: { play } } as any;

    w.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
    };

    // Ensure window.renderCanvasNode is NOT set to simulate real runtime w/o global
    delete w.renderCanvasNode;
    (global as any).window = w;

    try {
      const CanvasPage = plugin.CanvasPage as Function;

      // Render CanvasPage
      const el: any = CanvasPage({ nodes: [] });

      // Find the onDrop handler on canvas-workspace div and invoke it
      const workspace = created.find(
        (c) => c.type === "div" && c.props?.className === "canvas-workspace"
      );
      expect(workspace).toBeTruthy();
      const onDrop = workspace!.props.onDrop;
      expect(typeof onDrop).toBe("function");

      const currentTarget = {
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      } as any;
      const e: any = {
        clientX: 10,
        clientY: 20,
        currentTarget,
        dataTransfer: { getData: () => "" },
        preventDefault: () => {},
      };

      // Invoke drop -> it should call play with payload containing onComponentCreated
      onDrop(e);
      expect(play).toHaveBeenCalled();
      const payload = play.mock.calls[0][2];
      expect(typeof payload.onComponentCreated).toBe("function");

      // Simulate create symphony invoking the preserved callback
      payload.onComponentCreated({
        id: "rx-comp-button-1",
        cssClass: "rx-comp-button-1",
        type: "button",
        position: { x: 10, y: 20 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: { template: '<button class="rx-button">Button</button>' },
          integration: {
            canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
          },
        },
      });

      // After onComponentCreated, our stubbed setState is a no-op so
      // CanvasPage will not re-render automatically. To assert CSS injection
      // without relying on React re-render, call the pure renderer.
      plugin.renderCanvasNode({
        id: "rx-comp-button-1",
        cssClass: "rx-comp-button-1",
        type: "button",
        position: { x: 10, y: 20 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: { template: '<button class="rx-button">Button</button>' },
          integration: {
            canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
          },
        },
      });

      // Ensure style tags were injected for instance CSS
      const instTag = document.getElementById(
        "component-instance-css-rx-comp-button-1"
      ) as HTMLStyleElement | null;
      expect(instTag).toBeTruthy();
    } finally {
      (global as any).window = original;
    }
  });
});
