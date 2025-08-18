import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Canvas UI Plugin - overlay width/height updates during resize", () => {
  test("overlay css updates on onResizeUpdate and component instance css commits on onResizeEnd", async () => {
    // Reset head styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Minimal window + React stub
    (global as any).window = (global as any).window || {};
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => {
          ops.push({ type: "upsertStyleTag", id, cssText });
          return txn;
        }),
        commit: jest.fn((options?: any) => {
          ops.push({ type: "commit", options });
          return undefined;
        }),
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });
    (global as any).window.renderxCommunicationSystem = { stageCrew: { beginBeat }, __ops: ops } as any;

    const created: any[] = [];
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(), // run immediately
      useState: (init: any) => [init, () => {}], // setter is noop in tests
      cloneElement: (el: any, newProps: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    };
    (global as any).window.React = ReactStub as any;

    // Load UI plugin
    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-resize-1",
      cssClass: "rx-resize-1",
      type: "button",
      position: { x: 50, y: 60 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    };

    // Initial render with selectedId so overlay is created
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Assert overlay base CSS upsert recorded via StageCrew
    let opsArr = (global as any).window.renderxCommunicationSystem.__ops as any[];
    const firstUpsert = opsArr.find((o) => o.type === "upsertStyleTag" && o.id === `overlay-css-${node.id}`);
    expect(firstUpsert).toBeTruthy();
    const initialCss = (firstUpsert?.cssText || "").replace(/\s+/g, "");
    expect(initialCss).toContain(`.rx-overlay-${node.id}{`.replace(/\s+/g, ""));
    expect(initialCss).toContain(`width:100px`.replace(/\s+/g, ""));
    expect(initialCss).toContain(`height:30px`.replace(/\s+/g, ""));

    // Call resize update (simulate SE handle -> width/height change only)
    const w: any = (global as any).window;
    w.__rx_canvas_ui__?.onResizeUpdate?.({
      elementId: node.id,
      box: { x: node.position.x, y: node.position.y, w: 140, h: 50 },
    });

    // Verify overlay CSS upsert updated via StageCrew
    opsArr = (global as any).window.renderxCommunicationSystem.__ops as any[];
    const updatedUpsert = [...opsArr].reverse().find((o) => o.type === "upsertStyleTag" && o.id === `overlay-css-${node.id}`);
    const updatedCss = (updatedUpsert?.cssText || "").replace(/\s+/g, "");
    expect(updatedCss).toContain(`.rx-overlay-${node.id}{`.replace(/\s+/g, ""));
    expect(updatedCss).toContain(`width:140px`.replace(/\s+/g, ""));
    expect(updatedCss).toContain(`height:50px`.replace(/\s+/g, ""));

    // End resize and commit to instance CSS
    w.__rx_canvas_ui__?.onResizeEnd?.({
      elementId: node.id,
      box: { x: node.position.x, y: node.position.y, w: 140, h: 50 },
    });

    const instanceCssId = `component-instance-css-${node.id}`;
    const instanceTag = document.getElementById(instanceCssId) as HTMLStyleElement | null;
    expect(instanceTag).toBeTruthy();
    const instanceCss = (instanceTag?.textContent || "").replace(/\s+/g, "");
    // Ensure width/height declarations for the instance class reflect new size
    expect(instanceCss).toContain(`.${node.cssClass}{width:140px;}`.replace(/\s+/g, ""));
    expect(instanceCss).toContain(`.${node.cssClass}{height:50px;}`.replace(/\s+/g, ""));
  });
});

