import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("UI select payload contains geometry and callback", () => {
  test("onElementClick sends elementId, position, defaults, onSelectionChange", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const windowAny: any = (global as any).window || ((global as any).window = {});
    windowAny.renderxCommunicationSystem = { conductor } as any;

    const { onElementClick } = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/handlers/select.js"
    );

    const node = {
      id: "rx-comp-button-pl"
    , position: { x: 159, y: 124 },
      component: { integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } } },
    };

    const playSpy = jest.spyOn(conductor as any, "play");
    onElementClick(node)({ stopPropagation() {} });

    expect(playSpy).toHaveBeenCalledWith(
      "Canvas.component-select-symphony",
      "Canvas.component-select-symphony",
      expect.objectContaining({
        elementId: node.id,
        position: node.position,
        defaults: node.component.integration.canvasIntegration,
        onSelectionChange: expect.any(Function),
      })
    );
  });
});

