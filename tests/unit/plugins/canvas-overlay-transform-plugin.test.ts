import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Test Canvas Overlay Transform Plugin CIA/SPA compliance
 * Verifies overlay transforms are handled via StageCrew instead of direct DOM manipulation
 */

describe("Canvas Overlay Transform Plugin - CIA/SPA Compliance", () => {
  const pluginPath = "RenderX/public/plugins/canvas-overlay-transform-plugin/index.js";

  function makeStageCrewRecorder() {
    const ops: any[] = [];
    const beginBeat = (correlationId: string, meta?: any) => {
      const txn = {
        create: (tag: string, opts: any) => {
          const record = { type: "create", tag, ...opts };
          return {
            appendTo: (parent: string) => {
              ops.push({ ...record, parent });
              return txn;
            },
          };
        },
        remove: (selector: string) => {
          ops.push({ type: "remove", selector });
          return txn;
        },
        update: (selector: string, payload: any) => {
          ops.push({ type: "update", selector, payload });
          return txn;
        },
        commit: (options?: { batch?: boolean }) => {
          ops.push({ type: "commit", options });
        },
      };
      return txn;
    };
    return { ops, beginBeat };
  }

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  test("sequence is properly defined", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    expect(plugin.sequence).toBeDefined();
    expect(plugin.sequence.id).toBe("Canvas.overlay-transform-symphony");
    expect(plugin.sequence.movements).toHaveLength(1);
    expect(plugin.sequence.movements[0].beats).toHaveLength(2);
  });

  test("handleApplyTransform uses StageCrew create/update operations", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    const result = plugin.handlers.handleApplyTransform(
      { elementId: "test-element", delta: { dx: 10, dy: 20 } },
      { stageCrew: { beginBeat } }
    );

    expect(result).toEqual({ elementId: "test-element", delta: { dx: 10, dy: 20 } });

    // Should remove existing, create new style tag, and update its content
    const removes = ops.filter((o) => o.type === "remove");
    expect(removes).toHaveLength(1);
    expect(removes[0].selector).toBe("#overlay-transform-test-element");

    const creates = ops.filter((o) => o.type === "create");
    expect(creates).toHaveLength(1);
    expect(creates[0].tag).toBe("style");
    expect(creates[0].attrs.id).toBe("overlay-transform-test-element");
    expect(creates[0].parent).toBe("head");

    const updates = ops.filter((o) => o.type === "update");
    expect(updates).toHaveLength(1);
    expect(updates[0].selector).toBe("#overlay-transform-test-element");
    expect(updates[0].payload.text).toBe(".rx-overlay-test-element{transform:translate(10px,20px);}");

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("handleClearTransform uses StageCrew remove operation", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    const result = plugin.handlers.handleClearTransform(
      { elementId: "test-element" },
      { stageCrew: { beginBeat } }
    );

    expect(result).toEqual({ elementId: "test-element" });

    const removes = ops.filter((o) => o.type === "remove");
    expect(removes).toHaveLength(1);
    expect(removes[0].selector).toBe("#overlay-transform-test-element");

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("handlers are resilient to missing stageCrew", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);

    expect(() => {
      plugin.handlers.handleApplyTransform(
        { elementId: "test", delta: { dx: 5, dy: 10 } },
        {}
      );
    }).not.toThrow();

    expect(() => {
      plugin.handlers.handleClearTransform(
        { elementId: "test" },
        {}
      );
    }).not.toThrow();
  });

  test("delta values are properly rounded", () => {
    const plugin: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    plugin.handlers.handleApplyTransform(
      { elementId: "test", delta: { dx: 10.7, dy: -20.3 } },
      { stageCrew: { beginBeat } }
    );

    const update = ops.find((o) => o.type === "update");
    expect(update.payload.text).toBe(".rx-overlay-test{transform:translate(11px,-20px);}");
  });
});
