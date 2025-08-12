import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";

const uiPath = "RenderX/public/plugins/canvas-ui-plugin/handlers/drop.js";

describe("Canvas UI Plugin - drop integration via Library.component-drop-symphony", () => {
  let ui: any;

  beforeAll(() => {
    ui = loadRenderXPlugin(uiPath);
  });

  test("handleCanvasDrop calls Library.component-drop-symphony with parsed dragData and coordinates", () => {
    const play = jest.fn();
    const rect = { left: 100, top: 50 } as any;
    const currentTarget = { getBoundingClientRect: () => rect } as any;

    const dataTransfer = {
      getData: (type: string) =>
        type === "application/json"
          ? JSON.stringify({ foo: "bar", source: "element-library" })
          : "",
    } as any;

    const e: any = { clientX: 150, clientY: 80, currentTarget, dataTransfer };

    // Invoke helper
    ui.handleCanvasDrop({ play }, e, {
      onComponentCreated: () => {},
    });

    expect(play).toHaveBeenCalledWith(
      "Library.component-drop-symphony",
      "Library.component-drop-symphony",
      expect.objectContaining({
        coordinates: { x: 50, y: 30 },
        dragData: expect.objectContaining({ foo: "bar" }),
        source: "canvas-ui-plugin:drop",
      })
    );
  });
});
