import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Red: Selection overlay must match selected component bounds (not full canvas)
 * - Clicking a component should result in StageCrew ensuring overlay instance CSS positioned at the node's left/top with its default size
 */

describe("Selection overlay bounds via StageCrew", () => {
  test("click to select applies overlay-css-<id> with correct left/top/width/height", async () => {
    // Clean styles
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Conductor + selection plugin mounted
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const selection: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-selection-plugin/index.js"
    );
    await conductor.mount(
      selection.sequence,
      selection.handlers,
      selection.sequence.id
    );

    // Expose StageCrew recorder
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        update: jest.fn((selector: string, payload: any) => {
          ops.push({ type: "update", selector, payload });
          return txn;
        }),
        create: jest.fn((tagName: string, options: any) => {
          ops.push({ type: "create", tagName, options });
          return { appendTo: jest.fn((parent: string) => ops.push({ type: "appendTo", parent })) };
        }),
        remove: jest.fn((selector: string) => {
          ops.push({ type: "remove", selector });
          return txn;
        }),
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          ops.push({ type: "style", id, cssText });
          return txn;
        }),
        commit: jest.fn(() => {
          ops.push({ type: "commit" });
        }),
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

    // Route selection play() to handlers with StageCrew ctx
    jest
      .spyOn(conductor as any, "play")
      .mockImplementation((_p: string, seqId: string, payload: any) => {
        if (seqId !== "Canvas.component-select-symphony") return;
        const ctx: any = {
          payload: (conductor as any).__ctxPayload || {},
          stageCrew: { beginBeat },
          sequence: selection.sequence,
        };
        const res = selection.handlers.handleSelect(
          {
            elementId: payload?.elementId,
            onSelectionChange: payload?.onSelectionChange,
            position: payload?.position,
            defaults: payload?.defaults,
          },
          ctx
        );
        (conductor as any).__ctxPayload = {
          ...(ctx.payload || {}),
          ...(res || {}),
        };
        selection.handlers.handleFinalize(
          { elementId: payload?.elementId, clearSelection: false },
          ctx
        );
      });

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

    // Load UI plugin and render page with a single node
    const ui: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-comp-button-sel1",
      cssClass: "rx-comp-button-sel1",
      type: "button",
      position: { x: 25, y: 35 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 110, defaultHeight: 32 },
        },
      },
    };

    // Render
    created.length = 0;
    ui.CanvasPage({ nodes: [node], selectedId: node.id });

    // Find the canvas node UI element and simulate click
    const canvasEl = created.find(
      (e) =>
        e.type === "div" &&
        String(e.props?.className || "").includes(node.cssClass)
    );
    expect(canvasEl).toBeTruthy();

    // Click -> selection symphony (call handler directly)
    const { onElementClick } = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/handlers/select.js"
    );
    const clickHandler = onElementClick(node);
    clickHandler({ stopPropagation() {} });

    // Inspect StageCrew link element creation for overlay CSS
    const opsArr = (global as any).window.renderxCommunicationSystem
      .__ops as any[];
    const linkCreate = opsArr.find(
      (o) => o.type === "create" && o.tagName === "link" && o.options?.attrs?.id === `overlay-css-${node.id}`
    );
    expect(linkCreate).toBeTruthy();
    expect(linkCreate.options.attrs.rel).toBe("stylesheet");

    // Decode the CSS from the data URL
    const href = linkCreate.options.attrs.href;
    expect(href).toMatch(/^data:text\/css;charset=utf-8,/);
    const css = decodeURIComponent(href.replace(/^data:text\/css;charset=utf-8,/, '')).replace(/\s+/g, "");
    expect(css).toContain(
      `.rx-overlay-${node.id}{position:absolute;left:25px;top:35px;width:110px;height:32px;z-index:10;}`.replace(
        /\s+/g,
        ""
      )
    );
  });
});
