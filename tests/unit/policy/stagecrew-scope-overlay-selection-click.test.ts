import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Policy (Red): Overlay StageCrew operations must occur within play() sequence handlers
 * - Selection click path should result in overlayEnsure* beginBeat having sequenceId
 * Expected to FAIL currently because Canvas UI calls overlayEnsure* from UI code without handler context
 */

describe("Policy: Overlay StageCrew ops must be inside play() handlers (selection click flow)", () => {
  test("onElementClick -> selection -> overlayEnsure* beginBeat carries sequenceId", async () => {
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);

    // Mount selection plugin so UI click plays the sequence
    const selection: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-selection-plugin/index.js"
    );
    await conductor.mount(
      selection.sequence,
      selection.handlers,
      selection.sequence.id
    );

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
    (global as any).window.renderxCommunicationSystem = {
      conductor,
      stageCrew: { beginBeat },
      __ops: ops,
    } as any;

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(p || {}) },
      }),
    } as any;

    // UI
    const ui: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const clickHandlers: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/handlers/select.js"
    );
    const node = {
      id: "rx-overlay-scope-2",
      cssClass: "rx-overlay-scope-2",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 100, defaultHeight: 30 },
        },
      },
    };

    // Render CanvasPage with node so selection shows overlay
    ui.CanvasPage({ nodes: [node], selectedId: node.id });

    // Simulate click selection flow
    const click = clickHandlers.onElementClick(node);
    await click({ stopPropagation() {} });

    // Find overlay ensure transactions from selection handlers
    const overlayEnsures = ops.filter(
      (o) =>
        o.type === "beginBeat" &&
        o.meta?.handlerName === "overlayEnsure" &&
        o.meta?.plugin === "canvas-selection-plugin"
    );
    expect(overlayEnsures.length).toBeGreaterThan(0);

    // POLICY: must carry sequenceId (scope of play handler)
    overlayEnsures.forEach((b) => {
      expect(b.meta?.sequenceId).toBe("Canvas.component-select-symphony");
    });
  });
});
