import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../../utils/test-helpers";

const libraryPath = "RenderX/public/plugins/library-drop-plugin/index.js";
const createPath = "RenderX/public/plugins/canvas-create-plugin/index.js";

describe("Orchestrated Flow (real Conductor): Library.drop -> Canvas.create", () => {
  test("uses conductor.play (no local fallback); emits Canvas.create; invokes onComponentCreated", async () => {
    // Arrange real conductor + event bus
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    await conductor.registerCIAPlugins();

    // Capture conductor logs emitted by PluginManager logger
    const logs: string[] = [];
    eventBus.subscribe("musical-conductor:log", (evt: any) => {
      try {
        logs.push(String((evt?.message || [])[0]));
      } catch {}
    });

    const lib: any = loadRenderXPlugin(libraryPath);
    const create: any = loadRenderXPlugin(createPath);

    // Mount both plugins into real conductor
    await conductor.mount(lib.sequence, lib.handlers, lib.sequence.id);
    await conductor.mount(create.sequence, create.handlers, create.sequence.id);

    const onComponentCreated = jest.fn();

    // Act: play the library drop symphony via real conductor and wait until Canvas.create handler completes
    await new Promise<void>(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        try { unsubBeat(); } catch {}
        try { unsubHandlerEnd(); } catch {}
        reject(new Error("timeout waiting for Canvas.create handler end"));
      }, 5000);

      const unsubBeat = eventBus.subscribe("beat-completed", (evt: any) => {
        try {
          if (evt?.event === "canvas:component:create") {
            // beat completed, but still also wait for handler end to ensure callback fired
          }
        } catch {}
      });

      const unsubHandlerEnd = eventBus.subscribe("plugin:handler:end", (evt: any) => {
        try {
          if (evt?.pluginId === create.sequence.id && evt?.handlerName === "createCanvasComponent") {
            clearTimeout(timeout);
            try { unsubBeat(); } catch {}
            try { unsubHandlerEnd(); } catch {}
            resolve();
          }
        } catch {}
      });

      await conductor.play(lib.sequence.id, lib.sequence.id, {
        coordinates: { x: 200, y: 120 },
        dragData: {
          component: { metadata: { type: "button", name: "Button" } },
        },
        onComponentCreated,
      });
    });

    // Give microtask queue a chance to flush callback scheduling
    await new Promise((r) => setTimeout(r, 0));


    // Assert: no local fallback should be logged
    const hasLocalFallback = logs.some((m) =>
      m.includes("Local create fallback")
    );
    expect(hasLocalFallback).toBe(false);

    // Assert: flow forwarded to Canvas.create via conductor.play
    const hasForward = logs.some((m) => m.includes("Forwarding to Canvas.component-create-symphony"));
    expect(hasForward).toBe(true);

    // Assert: callback invoked
    expect(onComponentCreated).toHaveBeenCalledTimes(1);
    const createdArg = onComponentCreated.mock.calls[0][0];
    expect(String(createdArg.id)).toMatch(/^rx-comp-button-/);
    expect(String(createdArg.cssClass)).toMatch(/^rx-comp-button-/);
    expect(createdArg.type).toBe("button");
    expect(createdArg.position).toEqual({ x: 200, y: 120 });
  });
});
