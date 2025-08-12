import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";

const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/index.js";

describe("Canvas UI Plugin - UI drop wiring", () => {
  test("CanvasPage attaches onDragOver that calls preventDefault to allow drops", () => {
    const created: Array<{ type: any; props: any }> = [];

    const originalWindow: any = (global as any).window;
    const w: any = originalWindow || {};

    w.React = {
      useEffect: (fn: any) => fn(),
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props });
        return { type, props, children };
      },
    };

    (global as any).window = w;

    try {
      const plugin = loadRenderXPlugin(pluginPath);
      plugin.CanvasPage({});

      // Find the canvas surface element - prefer canvas-workspace then canvas-content
      const propsList = created.map((n) => n.props);
      const target =
        propsList.find(
          (p) =>
            p &&
            typeof p.className === "string" &&
            p.className.includes("canvas-workspace")
        ) ||
        propsList.find(
          (p) =>
            p &&
            typeof p.className === "string" &&
            p.className.includes("canvas-content")
        );

      expect(target).toBeTruthy();
      expect(typeof target.onDragOver).toBe("function");

      const e: any = { preventDefault: jest.fn() };
      target.onDragOver(e);
      expect(e.preventDefault).toHaveBeenCalled();
    } finally {
      (global as any).window = originalWindow;
    }
  });
});
