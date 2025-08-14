import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Canvas UI Plugin - overlay follows during drag", () => {
  test("overlay transform is applied on drag update and cleared on drag end", async () => {
    // Reset head styles
    while (document.head.firstChild) document.head.removeChild(document.head.firstChild);

    // Minimal window + React stub
    (global as any).window = (global as any).window || {};

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

    // Load plugin
    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/canvas-ui-plugin/index.js"
    );

    const node = {
      id: "rx-follow-1",
      cssClass: "rx-follow-1",
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

    // Assert no transform style tag initially
    expect(document.getElementById(`overlay-transform-${node.id}`)).toBeNull();

    // Dispatch a drag update event with delta
    const evUpdate = new CustomEvent("renderx:drag:update", {
      detail: { elementId: node.id, delta: { dx: 7, dy: 9 } },
    } as any);
    window.dispatchEvent(evUpdate);

    const t1 = document.getElementById(`overlay-transform-${node.id}`) as HTMLStyleElement | null;
    expect(t1).toBeTruthy();
    const css1 = (t1?.textContent || "").replace(/\s+/g, "");
    expect(css1).toContain(`.rx-overlay-${node.id}{transform:translate(7px,9px);}`.replace(/\s+/g, ""));

    // Dispatch another update to ensure it overwrites
    const evUpdate2 = new CustomEvent("renderx:drag:update", {
      detail: { elementId: node.id, delta: { dx: 2, dy: 3 } },
    } as any);
    window.dispatchEvent(evUpdate2);
    const t2 = document.getElementById(`overlay-transform-${node.id}`) as HTMLStyleElement | null;
    const css2 = (t2?.textContent || "").replace(/\s+/g, "");
    expect(css2).toContain(`.rx-overlay-${node.id}{transform:translate(2px,3px);}`.replace(/\s+/g, ""));

    // Drag end -> transform cleared
    const evEnd = new CustomEvent("renderx:drag:end", {
      detail: { elementId: node.id },
    } as any);
    window.dispatchEvent(evEnd);

    expect(document.getElementById(`overlay-transform-${node.id}`)).toBeNull();
  });
});

