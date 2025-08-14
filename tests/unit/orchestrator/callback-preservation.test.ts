import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Orchestrator responsibility: preserve callbacks across nested play(),
 * even when the nested payload undergoes JSON serialization that strips functions.
 */

describe("Orchestrator - callback preservation across nested play", () => {
  test("onComponentCreated survives nested play with function stripping", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Monkey-patch nested play to strip functions only for the create symphony
    const origPlay = (conductor as any).play.bind(conductor);
    (conductor as any).play = async (pluginName: string, sequenceId: string, payload?: any) => {
      const shouldStrip = sequenceId === "Canvas.component-create-symphony";
      const nextPayload = shouldStrip ? JSON.parse(JSON.stringify(payload || {})) : payload;
      return await origPlay(pluginName, sequenceId, nextPayload);
    };

    const created: any[] = [];
    const onComponentCreated = (node: any) => created.push(node);

    const component = { metadata: { name: "Button", type: "button" } };
    const coordinates = { x: 12, y: 34 };

    // Trigger library drop flow; shim should forward to create via nested play
    await (conductor as any).play(
      "Library.component-drop-symphony",
      "Library.component-drop-symphony",
      {
        component,
        coordinates,
        onComponentCreated,
      }
    );

    // Allow microtasks
    await new Promise((r) => setTimeout(r, 5));

    expect(created.length).toBe(1);
    const node = created[0];
    expect(typeof node?.id).toBe("string");
    expect(node?.cssClass).toBe(node?.id);
    expect(node?.type).toBe("button");
    expect(node?.position).toEqual(coordinates);
  });
});

