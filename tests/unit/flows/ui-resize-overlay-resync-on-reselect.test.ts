import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

function strip(s: string) { return (s || "").replace(/\s+/g, ""); }

describe("Canvas UI - overlay resyncs to committed size on reselect", () => {
  test("after resize commit, re-rendering overlay should use committed width/height from instance CSS", async () => {
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Conductor with resize plugin mounted
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const resize: any = loadRenderXPlugin("RenderX/public/plugins/canvas-resize-plugin/index.js");
    await conductor.mount(resize.sequence, resize.handlers, resize.sequence.id);

    (global as any).window = (global as any).window || {};
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        upsertStyleTag: jest.fn((id: string, cssText: string) => { ops.push({ type: 'upsertStyleTag', id, cssText }); return txn; }),
        commit: jest.fn((options?: any) => { ops.push({ type: 'commit', options }); }),
      };
      ops.push({ type: 'beginBeat', corrId, meta });
      return txn;
    });
    (global as any).window.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

    const created: any[] = [];
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({ ...el, props: { ...(el.props || {}), ...(newProps || {}) } }),
    };
    (global as any).window.React = ReactStub as any;

    const uiPlugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-reselect-1",
      cssClass: "rx-comp-button-reselect-1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    // Initial render with selection
    created.length = 0;
    uiPlugin.CanvasPage({ nodes: [node], selectedId: node.id });
    const overlayCssId = `overlay-css-${node.id}`;

    // Resize SE dx=20,dy=10
    const overlay = created.find((e) => e.type === "div" && String(e.props?.className || "").includes("rx-resize-overlay"));
    const handle = (overlay?.children || []).find((c: any) => /rx-se$/.test(String(c.props?.className || "")));
    await handle.props.onPointerDown({ clientX: 0, clientY: 0, stopPropagation() {}, pointerId: 1, target: { setPointerCapture() {} } });
    await handle.props.onPointerMove({ clientX: 20, clientY: 10, buttons: 1 });
    await new Promise((r) => setTimeout(r, 30));
    await handle.props.onPointerUp({ clientX: 20, clientY: 10, pointerId: 1, target: { releasePointerCapture() {} } });

    // Now, simulate reselect by re-rendering CanvasPage
    created.length = 0;
    uiPlugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const opsArr = (global as any).window.renderxCommunicationSystem.__ops as any[];
    const up = [...opsArr].reverse().find((o) => o.type === 'upsertStyleTag' && o.id === overlayCssId);
    const overlayCss = strip((up?.cssText || ""));

    // Expect committed size (140x50), not defaults (120x40)
    expect(overlayCss).toContain(strip(`.rx-overlay-${node.id}{position:absolute;left:10px;top:20px;width:140px;height:50px;`));
  });
});

