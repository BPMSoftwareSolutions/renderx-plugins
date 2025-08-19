import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Red: Overlay StageCrew must not originate from Canvas UI plugin code
 * Expect no beginBeat with meta.plugin === 'canvas-ui-plugin' && handlerName === 'overlayStyles'
 */

describe("Policy: Overlay StageCrew must not originate from Canvas UI plugin", () => {
  test("selection click flow emits no UI-origin overlay beginBeat", async () => {
    // Conductor + mount selection plugin
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const selection: any = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");
    await conductor.mount(selection.sequence, selection.handlers, selection.sequence.id);

    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: (id: string, cssText: string) => { ops.push({ type: "upsertStyleTag", id, cssText, meta }); return txn; },
        update: (selector: string, payload: any) => { ops.push({ type: "update", selector, payload, meta }); return txn; },
        commit: () => { ops.push({ type: "commit", meta }); },
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => { created.push({ type, props, children }); return { type, props, children }; },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    } as any;

    // UI + click handler
    const ui: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");
    const clickHandlers: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/handlers/select.js");

    const node = {
      id: "rx-overlay-policy-ui-origin",
      cssClass: "rx-overlay-policy-ui-origin",
      type: "button",
      position: { x: 15, y: 25 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 90, defaultHeight: 28 } },
      },
    };

    // Render page and click selection
    ui.CanvasPage({ nodes: [node], selectedId: node.id });
    const click = clickHandlers.onElementClick(node);
    await click({ stopPropagation() {} });

    // Assert: no UI-origin overlay beginBeat
    const uiOverlayBegins = ops.filter((o) => o.type === "beginBeat" && o.meta?.handlerName === "overlayStyles" && o.meta?.plugin === "canvas-ui-plugin");
    expect(uiOverlayBegins.length).toBe(0);
  });
});

