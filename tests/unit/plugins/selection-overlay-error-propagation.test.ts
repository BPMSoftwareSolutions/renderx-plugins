import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Red test: selection handler must not swallow overlay ensure errors.
 * If StageCrew.upsertStyleTag throws for overlay-css-global, handleSelect should surface the error.
 */

describe("Selection overlay ensure error propagation", () => {
  test("handleSelect rethrows when global overlay upsert fails", async () => {
    const selection: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-selection-plugin/index.js"
    );

    const elementId = "rx-comp-button-err1";
    const ctx: any = {
      sequence: { id: "Canvas.component-select-symphony" },
      stageCrew: {
        beginBeat: (_corrId: string, _meta: any) => {
          return {
            update: () => ({ commit: () => {} }),
            upsertStyleTag: (_id: string, _cssText: string) => {
              throw new Error("SC upsert failed");
            },
            commit: () => {},
          };
        },
      },
    };

    const call = () =>
      selection.handlers.handleSelect(
        {
          elementId,
          position: { x: 10, y: 20 },
          defaults: { defaultWidth: 120, defaultHeight: 40 },
        },
        ctx
      );

    expect(call).toThrow();
  });
});

