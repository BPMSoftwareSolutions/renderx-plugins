import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Selection overlay global CSS contains handle rules (not fallback)", () => {
  test("overlay-css-global includes corner and edge rules", async () => {
    // Reset styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const selection: any = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");
    await conductor.mount(selection.sequence, selection.handlers, selection.sequence.id);

    // StageCrew stub that injects styles into DOM
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          const tag = document.getElementById(id) || document.createElement("style");
          tag.id = id;
          tag.textContent = cssText;
          document.head.appendChild(tag);
          ops.push({ type: "upsertStyleTag", id, cssText });
          return txn;
        }),
        update: jest.fn(() => txn),
        commit: jest.fn(() => ops.push({ type: "commit" })),
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

    const ui: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-comp-button-emu2",
      cssClass: "rx-comp-button-emu2",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    // Render and click to select
    created.length = 0;
    ui.CanvasPage({ nodes: [node], selectedId: null });
    const { onElementClick } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/handlers/select.js");
    onElementClick(node)({ stopPropagation() {} });

    // Assert global CSS contains handle rules beyond the minimal fallback
    const globalTag = document.getElementById("overlay-css-global");
    const css = (globalTag?.textContent || "").replace(/\s+/g, " ");
    expect(css).toMatch(/\.rx-nw\b/);
    expect(css).toMatch(/\.rx-ne\b/);
    expect(css).toMatch(/\.rx-se\b/);
    expect(css).toMatch(/\.rx-sw\b/);
    expect(css).toMatch(/\.rx-e\b/);
    expect(css).toMatch(/\.rx-w\b/);
    expect(css).toMatch(/\.rx-n\b/);
    expect(css).toMatch(/\.rx-s\b/);
  });
});

