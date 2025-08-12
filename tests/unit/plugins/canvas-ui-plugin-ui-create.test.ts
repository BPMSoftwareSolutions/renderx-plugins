import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";

const helperPath = "RenderX/public/plugins/canvas-ui-plugin/handlers/drop.js";

describe("Canvas UI Plugin - drop passes onComponentCreated to symphony payload", () => {
  test("handleCanvasDrop includes onComponentCreated in the payload", () => {
    const helper: any = loadRenderXPlugin(helperPath);
    const play = jest.fn();

    const currentTarget = {
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    } as any;
    const e: any = {
      clientX: 10,
      clientY: 20,
      currentTarget,
      dataTransfer: { getData: () => "" },
    };
    const onComponentCreated = jest.fn();

    helper.handleCanvasDrop({ play }, e, { onComponentCreated });

    expect(play).toHaveBeenCalled();
    const payload = play.mock.calls[0][2];
    expect(payload.onComponentCreated).toBe(onComponentCreated);
  });
});
