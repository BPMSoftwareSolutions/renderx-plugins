import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Red: Selection plugin must perform StageCrew transactions to show/hide selection
 * Expectations:
 * - handleSelect: begins a beat and updates the selected element to add a selection class
 * - handleFinalize (when clearSelection===true): begins a beat and removes the selection class
 */

describe("Canvas Selection Plugin - StageCrew transactions", () => {
  const plugin = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");

  function makeCtx() {
    const calls: any[] = [];
    const stageCrew = {
      beginBeat: (corrId: string, meta: any) => {
        const tx = {
          update: (selector: string, payload: any) => {
            calls.push({ kind: "update", selector, payload, corrId, meta });
            return tx;
          },
          upsertStyleTag: (id: string, cssText: string) => {
            calls.push({ kind: "style", id, cssText, corrId, meta });
            return tx;
          },
          commit: () => {
            calls.push({ kind: "commit", corrId, meta });
          },
        };
        calls.push({ kind: "begin", corrId, meta });
        return tx;
      },
    };
    return { ctx: { stageCrew, sequence: plugin.sequence, payload: {} as any }, calls };
  }

  test("handleSelect adds selection class via StageCrew", () => {
    const { ctx, calls } = makeCtx();
    const elementId = "id-123";

    plugin.handlers.handleSelect({ elementId }, ctx as any);

    // Must begin a beat and perform an update on #<id>
    const begin = calls.find((c) => c.kind === "begin");
    expect(begin).toBeTruthy();
    const upd = calls.find((c) => c.kind === "update" && c.selector === `#${elementId}`);
    expect(upd).toBeTruthy();
    expect(upd.payload?.classes?.add || []).toContain("rx-comp-selected");
    const committed = calls.some((c) => c.kind === "commit");
    expect(committed).toBe(true);
  });

  test("handleFinalize removes selection class when clearSelection===true", () => {
    const { ctx, calls } = makeCtx();
    const elementId = "id-123";

    plugin.handlers.handleFinalize({ elementId, clearSelection: true }, ctx as any);

    const upd = calls.find((c) => c.kind === "update" && c.selector === `#${elementId}`);
    expect(upd).toBeTruthy();
    expect(upd.payload?.classes?.remove || []).toContain("rx-comp-selected");
  });
});

