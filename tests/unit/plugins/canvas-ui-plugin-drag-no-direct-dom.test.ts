import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * TDD Red: Canvas UI drag handlers must not directly mutate DOM (classList/style)
 * They should rely on StageCrew via conductor.play -> canvas-drag-plugin handlers
 */

describe("Canvas UI drag handlers - no direct DOM mutations", () => {
  function makeNode() {
    return {
      id: "rx-dd-no-dom",
      cssClass: "rx-dd-no-dom",
      type: "button",
      position: { x: 0, y: 0 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: { template: '<button class="rx-button">OK</button>', styles: { css: ".rx-button{color:#000}" } },
        integration: { canvasIntegration: { defaultWidth: 100, defaultHeight: 30 } },
      },
    } as any;
  }

  test("onPointerDown/up should not call classList.add/remove or write style properties directly", async () => {
    // Reset window and minimal globals
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor: {} } as any;

    // Stub React used by the UI plugin
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        const el = { type, props, children }; created.push(el); return el;
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      cloneElement: (el: any, p?: any) => ({ ...el, props: { ...(el.props||{}), ...(p||{}) } }),
    } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");
    const node = makeNode();

    // Render element to get drag handlers
    const el = plugin.renderCanvasNode(node);

    // Build a currentTarget stub that records classList and style writes
    const classList = { add: jest.fn(), remove: jest.fn() };

    const style: any = {};
    const touchActionSetter = jest.fn();
    const willChangeSetter = jest.fn();
    const transformSetter = jest.fn();
    Object.defineProperty(style, "touchAction", { set: touchActionSetter, get: () => "", configurable: true });
    Object.defineProperty(style, "willChange", { set: willChangeSetter, get: () => "", configurable: true });
    Object.defineProperty(style, "transform", { set: transformSetter, get: () => "", configurable: true });

    const currentTarget: any = { classList, style };
    const target: any = { setPointerCapture: jest.fn(), releasePointerCapture: jest.fn() };

    // Start drag (down)
    el.props.onPointerDown({ currentTarget, clientX: 1, clientY: 2, pointerId: 1, target, stopPropagation(){} });

    // Move a bit (not asserting here; focus on direct DOM writes)
    el.props.onPointerMove({ currentTarget, clientX: 5, clientY: 7 });

    // End drag (up)
    el.props.onPointerUp({ currentTarget, clientX: 5, clientY: 7, pointerId: 1, target });

    // Assert: NO direct DOM mutations invoked by UI drag handlers
    expect(classList.add).not.toHaveBeenCalled();
    expect(classList.remove).not.toHaveBeenCalled();
    expect(touchActionSetter).not.toHaveBeenCalled();
    expect(willChangeSetter).not.toHaveBeenCalled();
    expect(transformSetter).not.toHaveBeenCalled();
  });
});

