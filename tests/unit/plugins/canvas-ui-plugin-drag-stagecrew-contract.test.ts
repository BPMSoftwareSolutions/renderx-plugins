import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

/**
 * Verifies StageCrew commit contract during drag and overlay CSS scoping
 * Issue: #21 - Missing StageCrew commits during drag; overlay spans canvas
 */

describe("Canvas UI drag - StageCrew commit contract and overlay scoping", () => {
  function makeNode() {
    return {
      id: "rx-drag-sc",
      cssClass: "rx-drag-sc",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    } as any;
  }

  test("onPointerDown/move/up use StageCrew beginBeat/update/commit and commit instance position; overlay CSS is per-instance", async () => {
    // Reset head and window
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);
    (global as any).window = (global as any).window || {};

    // Conductor and StageCrew recorder
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const ops: any[] = [];
    const beginBeat = jest.fn((corrId: string, meta: any) => {
      const txn: any = {
        update: jest.fn((selector: string, payload: any) => { ops.push({ type: "update", selector, payload }); return txn; }),
        upsertStyleTag: jest.fn((id: string, cssText: string) => { ops.push({ type: "upsertStyleTag", id, cssText }); return txn; }),
        commit: jest.fn((options?: any) => { ops.push({ type: "commit", options }); return undefined; }),
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    });

    (global as any).window.renderxCommunicationSystem = { conductor, stageCrew: { beginBeat }, __ops: ops } as any;

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => { const el = { type, props, children }; created.push(el); return el; },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = makeNode();

    // Render page with selection so overlay is ensured via StageCrew
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    // Assert overlay instance CSS was upserted via StageCrew and is scoped to instance (not full canvas)
    const overlayUpsert = ops.find((o) => o.type === "upsertStyleTag" && o.id === `overlay-css-${node.id}`);
    expect(overlayUpsert).toBeTruthy();
    const overlayCss = String(overlayUpsert?.cssText || "").replace(/\s+/g, "");
    expect(overlayCss).toContain(`.rx-overlay-${node.id}{`.replace(/\s+/g, ""));
    expect(overlayCss).toContain(`width:100px`.replace(/\s+/g, ""));
    expect(overlayCss).toContain(`height:30px`.replace(/\s+/g, ""));

    // Render element to get drag handlers
    const el = plugin.renderCanvasNode(node);
    const domEl = document.createElement("div");

    // Start drag
    el.props.onPointerDown({ currentTarget: domEl, clientX: 0, clientY: 0, pointerId: 1, target: { setPointerCapture(){} }, stopPropagation(){} });

    // Move by (7, 9) and allow rAF to flush
    el.props.onPointerMove({ currentTarget: domEl, clientX: 7, clientY: 9 });
    await new Promise((r) => setTimeout(r, 25));

    // End drag
    el.props.onPointerUp({ currentTarget: domEl, clientX: 7, clientY: 9, pointerId: 1, target: { releasePointerCapture(){} } });

    // Assertions: StageCrew beginBeat/update/commit for start
    const startBeat = ops.find((o) => o.type === "beginBeat" && /drag:start:/.test(o.corrId));
    expect(startBeat).toBeTruthy();
    expect(ops.some((o, i) => o.type === "beginBeat" && /drag:start:/.test(o.corrId) && ops.slice(i+1).some(p => p.type === "commit"))).toBe(true);

    // Assertions: StageCrew beginBeat/update/commit for a frame
    const frameBeatIdx = ops.findIndex((o) => o.type === "beginBeat" && /drag:frame:/.test(o.corrId));
    expect(frameBeatIdx).toBeGreaterThanOrEqual(0);
    const frameUpdate = ops.slice(frameBeatIdx + 1).find((o) => o.type === "update");
    expect(frameUpdate).toBeTruthy();
    expect((frameUpdate as any).selector).toBe(`#${node.id}`);
    expect(String((frameUpdate as any).payload?.style?.transform || "")).toMatch(/translate3d\(7px,\s*9px,\s*0\)/);
    const frameHasCommit = ops.slice(frameBeatIdx + 1).some((o) => o.type === "commit");
    expect(frameHasCommit).toBe(true);

    // Assertions: StageCrew beginBeat/commit for end
    const endBeat = ops.find((o) => o.type === "beginBeat" && /drag:end:/.test(o.corrId));
    expect(endBeat).toBeTruthy();
    expect(ops.some((o, i) => o.type === "beginBeat" && /drag:end:/.test(o.corrId) && ops.slice(i+1).some(p => p.type === "commit"))).toBe(true);

    // Assertions: instance position committed via upsert after end (10+7, 20+9) = (17, 29)
    const instPosUpsert = [...ops].reverse().find((o) => o.type === "upsertStyleTag" && o.id === `component-instance-css-${node.id}`);
    expect(instPosUpsert).toBeTruthy();
    const instCss = String(instPosUpsert?.cssText || "").replace(/\s+/g, "");
    expect(instCss).toContain(`.${node.cssClass}{position:absolute;left:17px;top:29px;`.replace(/\s+/g, ""));

    // Also ensure the instance position beat was committed
    const posBeatIdx = ops.findIndex((o) => o.type === "beginBeat" && o.corrId === `instance:pos:${node.id}`);
    expect(posBeatIdx).toBeGreaterThanOrEqual(0);
    expect(ops.slice(posBeatIdx + 1).some((o) => o.type === "commit")).toBe(true);
  });
});

