import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function strip(s: string) {
  return (s || "").replace(/\s+/g, "");
}

describe("Canvas UI Overlay - resize payload contract (startBox + callbacks)", () => {
  test("onPointerDown passes startBox and callbacks; onPointerMove must include startBox + onResizeUpdate; onPointerUp includes onResizeEnd", async () => {
    // Reset head
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    // Stub conductor to capture play payloads
    const plays: any[] = [];
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = {
      conductor: {
        play: (_a: any, _b: any, payload: any) => plays.push(payload),
      },
    } as any;

    // React stub
    const created: any[] = [];
    const ReactStub = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, newProps: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    };
    (global as any).window.React = ReactStub as any;

    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-resize-contract-1",
      cssClass: "rx-resize-contract-1",
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

    // Render page with overlay
    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const overlay = created.find(
      (e) =>
        e.type === "div" &&
        String(e.props?.className || "").includes("rx-resize-overlay")
    );
    const handle = (overlay?.children || []).find((c: any) =>
      /rx-se/.test(String(c.props?.className || ""))
    );
    expect(handle).toBeTruthy();

    // Pointer down
    await handle.props.onPointerDown({
      clientX: 0,
      clientY: 0,
      stopPropagation() {},
    });
    // Pointer move
    await handle.props.onPointerMove({ clientX: 20, clientY: 10 });
    // Give rAF time to run and play to be recorded
    await new Promise((r) => setTimeout(r, 30));
    // Pointer up
    await handle.props.onPointerUp({ clientX: 20, clientY: 10 });

    // Validate plays
    // 1) onPointerDown first play should include startBox (120x40) and callbacks
    const down = plays.find((p) => p && p.start && p.handle === "se");
    expect(down).toBeTruthy();
    expect(down.startBox && down.startBox.w).toBe(120);
    expect(down.startBox && down.startBox.h).toBe(40);
    expect(typeof down.onResizeUpdate === "function").toBe(true);
    expect(typeof down.onResizeEnd === "function").toBe(true);

    // 2) onPointerMove should include delta and also include startBox + onResizeUpdate for each play
    const moves = plays.filter((p) => p && p.delta && p.handle === "se");
    expect(moves.length).toBeGreaterThanOrEqual(1);
    moves.forEach((m) => {
      expect(m.startBox && m.startBox.w).toBe(120); // baseline expected
      expect(m.startBox && m.startBox.h).toBe(40);
      expect(typeof m.onResizeUpdate === "function").toBe(true);
    });

    // 3) onPointerUp should include onResizeEnd callback
    const end = plays.find((p) => p && p.end === true && p.handle === "se");
    expect(end).toBeTruthy();
    expect(typeof end.onResizeEnd === "function").toBe(true);
  });
});
