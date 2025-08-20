import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Red tests: drag handlers
 * - ignore events with missing elementId
 * - do not persist position at dragEnd when position is missing
 */

describe("Drag handlers guards and persist policy", () => {
  const drag: any = loadRenderXPlugin(
    "RenderX/public/plugins/canvas-drag-plugin/index.js"
  );

  test("handleDragStart ignores missing elementId", () => {
    const res = drag.handlers.handleDragStart(
      { elementId: undefined, origin: { x: 1, y: 2 } },
      {} as any
    );
    expect(res).toEqual({});
  });

  test("handleDragMove ignores missing elementId", () => {
    const res = drag.handlers.handleDragMove(
      { elementId: undefined, delta: { dx: 10, dy: 10 } },
      {} as any
    );
    expect(res).toEqual({});
  });

  test("handleDragEnd skips persist when position missing", () => {
    const calls: any[] = [];
    const txn = {
      update: () => txn,
      commit: () => calls.push("commit"),
    } as any;
    const ctx: any = {
      stageCrew: { beginBeat: () => txn },
      logger: { info: (...a: any[]) => calls.push(["info", ...a]) },
    };
    const res = drag.handlers.handleDragEnd(
      { elementId: "id1", position: undefined },
      ctx
    );
    expect(res).toEqual({});
    const hasSkipLog = calls.some(
      (c) =>
        Array.isArray(c) &&
        c[0] === "info" &&
        /skip persist/i.test(String(c[1] || ""))
    );
    expect(hasSkipLog).toBe(true);
  });
});
