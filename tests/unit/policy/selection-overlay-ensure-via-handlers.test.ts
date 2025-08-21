import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Red: Selection overlay must be ensured via handlers (not UI)
 * - After clicking a node, StageCrew should upsert overlay-css-global and overlay-css-<id>
 * - The beginBeat meta should indicate selection plugin and include sequenceId
 * - No beginBeat should originate from canvas-ui-plugin overlayStyles
 */

describe("Selection overlay ensure via handlers", () => {
  test("click selection upserts global + instance overlay CSS with proper meta", async () => {
    // Clean DOM styles
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

    // StageCrew recorder
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
          ops.push({ type: "upsertStyleTag", id, cssText });
          return txn;
        }),
        removeStyleTag: jest.fn((id: string) => {
          ops.push({ type: "removeStyleTag", id });
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

    // Route selection play to handlers with StageCrew ctx
    const playSpy = jest
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

    // Load UI plugin and render page with a node
    const ui: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );
    const node = {
      id: "rx-comp-button-selov1",
      cssClass: "rx-comp-button-selov1",
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

    // Render and click
    created.length = 0;
    ui.CanvasPage({ nodes: [node], selectedId: null });

    const { onElementClick } = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/handlers/select.js"
    );
    const clickHandler = onElementClick(node);
    clickHandler({ stopPropagation() {} });

    // Assertions
    const arr = (global as any).window.renderxCommunicationSystem
      .__ops as any[];

    // Check for global overlay CSS creation (style element)
    const globalCreate = arr.find(
      (o) => o.type === "create" && o.tagName === "style" && o.options?.attrs?.id === "overlay-css-global"
    );
    expect(globalCreate).toBeTruthy();

    // Check for instance overlay CSS creation (link element)
    const instCreate = arr.find(
      (o) => o.type === "create" && o.tagName === "link" && o.options?.attrs?.id === `overlay-css-${node.id}`
    );
    expect(instCreate).toBeTruthy();
    expect(instCreate.options.attrs.rel).toBe("stylesheet");

    // Decode CSS from data URL
    const href = instCreate.options.attrs.href;
    const css = decodeURIComponent(href.replace(/^data:text\/css;charset=utf-8,/, '')).replace(/\s+/g, "");
    expect(css).toContain(`.rx-overlay-${node.id}{`.replace(/\s+/g, ""));

    const selectBegin = arr.find(
      (o) =>
        o.type === "beginBeat" && o.meta?.plugin === "canvas-selection-plugin"
    );
    expect(selectBegin).toBeTruthy();
    expect(selectBegin.meta?.sequenceId).toBe(
      "Canvas.component-select-symphony"
    );

    const uiOverlayBegins = arr.filter(
      (o) =>
        o.type === "beginBeat" &&
        o.meta?.plugin === "canvas-ui-plugin" &&
        o.meta?.handlerName === "overlayStyles"
    );
    expect(uiOverlayBegins.length).toBe(0);
  });
});
