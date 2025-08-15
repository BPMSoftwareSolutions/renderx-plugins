import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Verifies HeaderCenter toggle buttons do NOT call missing panel-toggle-symphony
 * and that we use shell callbacks instead.
 */

describe("HeaderCenter - panel toggles call callbacks, not a conductor symphony", () => {
  test("Clicking toggles invokes provided callbacks and does not call Conductor.play()", () => {
    // Arrange: window + conductor spy
    const play = jest.fn();
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = {
      conductor: { play },
    } as any;

    // React stub
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        const el = { type, props: props || {}, children };
        created.push(el);
        return el;
      },
      useEffect: (_fn: any) => {},
      useState: (init: any) => [init, () => {}],
    } as any;

    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/header/center/index.js"
    );

    // Provide callbacks from the shell
    const onToggleElementLibrary = jest.fn();
    const onToggleControlPanel = jest.fn();
    created.length = 0;
    plugin.HeaderCenter({
      onToggleElementLibrary,
      onToggleControlPanel,
      showElementLibrary: true,
      showControlPanel: false,
    });

    const libBtn = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__lib1/.test(e.props?.className || "")
    );
    const ctlBtn = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__ctl1/.test(e.props?.className || "")
    );

    // Click both
    libBtn?.props?.onClick?.();
    ctlBtn?.props?.onClick?.();

    expect(onToggleElementLibrary).toHaveBeenCalledTimes(1);
    expect(onToggleControlPanel).toHaveBeenCalledTimes(1);
    expect(play).not.toHaveBeenCalled();
  });
});

