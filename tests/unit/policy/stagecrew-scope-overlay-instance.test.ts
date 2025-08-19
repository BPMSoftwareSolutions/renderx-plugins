import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Policy (Red): Overlay StageCrew operations must occur within play() sequence handlers
 * - Any beginBeat emitted by overlayEnsure* must carry sequenceId in meta
 * Expected to FAIL currently because Canvas UI calls overlayEnsure* from UI code without handler context
 */

describe("Policy: Overlay StageCrew ops must be inside play() handlers (with sequenceId)", () => {
  test("CanvasPage render (selected node) → overlayEnsure* beginBeat carries sequenceId", async () => {
    // Conductor + StageCrew recorder
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: (id: string, cssText: string) => {
          ops.push({ type: "upsertStyleTag", id, cssText, meta });
          return txn;
        },
        update: (selector: string, payload: any) => {
          ops.push({ type: "update", selector, payload, meta });
          return txn;
        },
        commit: () => {
          ops.push({ type: "commit", meta });
        },
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });

    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({ ...el, props: { ...(el.props || {}), ...(p || {}) } }),
    } as any;

    // Load UI and render a node with selection so overlay is ensured via StageCrew
    const ui: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");
    const node = {
      id: "rx-overlay-scope-1",
      cssClass: "rx-overlay-scope-1",
      type: "button",
      position: { x: 25, y: 35 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 110, defaultHeight: 32 } },
      },
    };

    created.length = 0;
    ui.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find overlay-related StageCrew beginBeats (overlayStyles from canvas-ui-plugin)
    const overlayBegins = ops.filter(
      (o) => o.type === "beginBeat" && o.meta?.handlerName === "overlayStyles" && o.meta?.plugin === "canvas-ui-plugin"
    );
    expect(overlayBegins.length).toBeGreaterThan(0);

    // POLICY: every overlay beginBeat must have a sequenceId (i.e., originated inside a play() handler)
    overlayBegins.forEach((b) => {
      expect(b.meta?.sequenceId).toBeTruthy(); // Expected to FAIL today
    });
  });
});

