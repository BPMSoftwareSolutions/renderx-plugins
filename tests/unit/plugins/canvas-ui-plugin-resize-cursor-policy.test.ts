import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function makeClassList() {
  const s = new Set<string>();
  return {
    add: (c: string) => s.add(c),
    remove: (c: string) => s.delete(c),
    contains: (c: string) => s.has(c),
    toString: () => Array.from(s).join(" "),
  } as any;
}

describe("Canvas UI Overlay - resize cursor policy", () => {
  test("pointerup should restore rx-comp-draggable and remove rx-comp-grabbing", async () => {
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

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
    (global as any).window = (global as any).window || {};
    (global as any).window.React = ReactStub as any;
    (global as any).window.renderxCommunicationSystem = { conductor: { play: () => {} } } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    const node = {
      id: "rx-cursor-resize-1",
      cssClass: "rx-comp-button-cursor-resize-1",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 120, defaultHeight: 40 } },
      },
    };

    created.length = 0;
    plugin.CanvasPage({ nodes: [node], selectedId: node.id });

    const overlay = created.find((e) => e.type === "div" && String(e.props?.className || "").includes("rx-resize-overlay"));
    const handle = (overlay?.children || []).find((c: any) => /rx-se$/.test(String(c.props?.className || "")));
    expect(handle).toBeTruthy();

    const classList = makeClassList();
    const downEvt: any = { clientX: 0, clientY: 0, pointerId: 1, stopPropagation() {}, currentTarget: { classList }, target: { setPointerCapture() {} } };
    const upEvt: any = { clientX: 20, clientY: 10, pointerId: 1, currentTarget: { classList }, target: { releasePointerCapture() {} } };

    // Down: should switch to grabbing
    await handle.props.onPointerDown(downEvt);
    expect(classList.contains("rx-comp-grabbing")).toBe(true);
    expect(classList.contains("rx-comp-draggable")).toBe(false);

    // Up: must restore
    await handle.props.onPointerUp(upEvt);
    // Failing expectations (current impl may not restore draggable)
    expect(classList.contains("rx-comp-grabbing")).toBe(false);
    expect(classList.contains("rx-comp-draggable")).toBe(true);
  });
});

