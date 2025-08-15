import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("Component Library UI - remount behavior", () => {
  test("LibraryPanel should re-play load-components-symphony on remount (no stuck Loading...) ", () => {
    // Arrange conductor and window
    const play = jest.fn();
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = {
      conductor: {
        play,
        getMountedPlugins: () => ["Component Library Plugin"],
        getMountedPluginIds: () => ["load-components-symphony"],
      },
    } as any;

    // React stub that runs effects immediately
    const created: any[] = [];
    (global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        const el = { type, props: props || {}, children };
        created.push(el);
        return el;
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
      useMemo: (factory: any, _deps?: any[]) => factory(),
      cloneElement: (el: any, newProps: any) => ({
        ...el,
        props: { ...(el.props || {}), ...(newProps || {}) },
      }),
    } as any;

    // Load plugin
    const plugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/component-library-plugin/index.js"
    );

    // Initial mount
    (global as any).window.__rx_library_played__ = undefined;
    created.length = 0;
    plugin.LibraryPanel({});
    expect(play).toHaveBeenCalledTimes(1);

    // Simulate remount (e.g., after toggling panel visibility)
    created.length = 0;
    plugin.LibraryPanel({});

    // Desired: should call play again to re-request components on remount
    // Current bug: window.__rx_library_played__ guards and prevents replay, leaving Loading... UI stuck
    expect(play).toHaveBeenCalledTimes(2);
  });
});
