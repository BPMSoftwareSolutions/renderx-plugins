import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function strip(s: string) {
  return (s || "").replace(/\s+/g, "");
}

describe("Canvas UI - no overlay updates after pointerup (hover inert)", () => {
  test("after pointerup, extra onPointerMove with buttons=0 should neither play nor change overlay CSS", async () => {
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    const plays: any[] = [];
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = {
      conductor: {
        play: (_a: any, _b: any, payload: any) => plays.push(payload),
      },
    } as any;

    const created: any[] = [];
    const ReactStub = {
      createElement: (t: any, p: any, ...c: any[]) => {
        created.push({ type: t, props: p, children: c });
        return { type: t, props: p, children: c };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, np: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(np || {}) },
      }),
    };
    (global as any).window.React = ReactStub as any;

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-inert-1",
      cssClass: "rx-comp-button-def456",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template: '<button class="rx-button">OK</button>',
          styles: { css: ".rx-button{color:#000}" },
        },
        integration: {
          canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
        },
      },
    };

    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const overlayCssId = `overlay-css-${node.id}`;
    const overlay = created.find(
      (e) =>
        e.type === "div" &&
        String(e.props?.className || "").includes("rx-resize-overlay")
    );
    const handle = (overlay?.children || []).find((c: any) =>
      /rx-se/.test(String(c.props?.className || ""))
    );
    expect(handle).toBeTruthy();

    await handle.props.onPointerDown({
      clientX: 0,
      clientY: 0,
      stopPropagation() {},
      pointerId: 1,
      target: { setPointerCapture() {}, releasePointerCapture() {} },
    });
    await handle.props.onPointerMove({ clientX: 20, clientY: 10, buttons: 1 });
    await new Promise((r) => setTimeout(r, 30));

    const before = strip(
      document.getElementById(overlayCssId)?.textContent || ""
    );
    const deltaCountBeforeUp = plays.filter((p) => p && p.delta).length;

    await handle.props.onPointerUp({
      clientX: 20,
      clientY: 10,
      pointerId: 1,
      target: { releasePointerCapture() {} },
    });

    // Hover-only move after up
    await handle.props.onPointerMove({ clientX: 40, clientY: 20, buttons: 0 });
    await new Promise((r) => setTimeout(r, 30));

    const after = strip(
      document.getElementById(overlayCssId)?.textContent || ""
    );
    const deltaCountAfterHover = plays.filter((p) => p && p.delta).length;

    // Expectations
    expect(after).toBe(before); // overlay unchanged
    expect(deltaCountBeforeUp).toBeGreaterThanOrEqual(1); // first move happened
    expect(deltaCountAfterHover).toBe(deltaCountBeforeUp); // no further move plays after up
  });
});
