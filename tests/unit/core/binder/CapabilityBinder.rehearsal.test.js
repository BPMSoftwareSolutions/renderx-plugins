const path = require("path");

describe("CapabilityBinder", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("resolves explicit behavior binding from component JSON", () => {
    const binder = require("../../../../core/binder/CapabilityBinder.js");
    const node = {
      id: "n1",
      component: {
        metadata: { type: "button", name: "Button" },
        behaviors: {
          drag: { plugin: "Canvas.component-drag-symphony" }
        }
      }
    };

    const id = binder.resolvePluginId(node, "drag");
    expect(id).toBe("Canvas.component-drag-symphony");
  });

  test("falls back to type default from registry when behavior missing", () => {
    const binder = require("../../../../core/binder/CapabilityBinder.js");
    const node = {
      id: "n2",
      component: { metadata: { type: "line", name: "Line" } }
    };
    const id = binder.resolvePluginId(node, "drag");
    // For now defaults map line.drag to existing drag symphony id
    expect(id).toBe("Canvas.component-drag-symphony");
  });

  test("falls back to wildcard default and play() uses id for both args", async () => {
    const binder = require("../../../../core/binder/CapabilityBinder.js");
    const node = {
      id: "n3",
      component: { metadata: { type: "unknown", name: "Unknown" } }
    };

    // wildcard default for 'select' should exist
    const id = binder.resolvePluginId(node, "select");
    expect(id).toBe("Canvas.component-select-symphony");

    // play() calls conductor with (id,id,payload+config)
    const calls = [];
    const conductor = { play: (channel, seqId, payload) => { calls.push({ channel, seqId, payload }); return Promise.resolve(); } };
    await binder.play(conductor, node, "select", { foo: 1 });
    expect(calls.length).toBe(1);
    expect(calls[0].channel).toBe("Canvas.component-select-symphony");
    expect(calls[0].seqId).toBe("Canvas.component-select-symphony");
    expect(calls[0].payload.foo).toBe(1);
  });
});

