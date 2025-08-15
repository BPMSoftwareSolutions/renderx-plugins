import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

// Common React stub for header plugin tests
function installReactStub(created: any[]) {
  const ReactStub = {
    createElement: (type: any, props: any, ...children: any[]) => {
      const el = { type, props: props || {}, children };
      created.push(el);
      return el;
    },
    useEffect: (_fn: any) => {},
    useState: (init: any) => [init, () => {}],
    cloneElement: (el: any, newProps: any) => ({
      ...el,
      props: { ...(el.props || {}), ...(newProps || {}) },
    }),
  } as any;
  (global as any).window = (global as any).window || {};
  (global as any).window.React = ReactStub;
}

describe("Header Plugins - exports and basic rendering", () => {
  beforeEach(() => {
    (global as any).window = (global as any).window || {};
  });

  test("HeaderLeft exports function and renders unsaved indicator when hasUnsavedChanges=true", () => {
    const created: any[] = [];
    installReactStub(created);
    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/header/left/index.js"
    );
    expect(typeof plugin.HeaderLeft).toBe("function");

    created.length = 0;
    plugin.HeaderLeft({ hasUnsavedChanges: true });

    const hasIndicator = created.some(
      (e) => e.type === "span" && /rx-comp-unsaved__dot1/.test(e.props?.className || "")
    );
    expect(hasIndicator).toBe(true);
  });

  test("HeaderCenter exports function; buttons disabled when callbacks missing, enabled when provided", () => {
    const created: any[] = [];
    installReactStub(created);
    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/header/center/index.js"
    );
    expect(typeof plugin.HeaderCenter).toBe("function");

    // Without callbacks
    created.length = 0;
    plugin.HeaderCenter({ showElementLibrary: false, showControlPanel: true });
    const libBtn1 = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__lib1/.test(e.props?.className || "")
    );
    const ctlBtn1 = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__ctl1/.test(e.props?.className || "")
    );
    expect(libBtn1?.props?.disabled).toBe(true);
    expect(ctlBtn1?.props?.disabled).toBe(true);

    // With callbacks
    created.length = 0;
    const onToggleElementLibrary = jest.fn();
    const onToggleControlPanel = jest.fn();
    plugin.HeaderCenter({
      onToggleElementLibrary,
      onToggleControlPanel,
      showElementLibrary: true,
      showControlPanel: false,
    });
    const libBtn2 = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__lib1/.test(e.props?.className || "")
    );
    const ctlBtn2 = created.find(
      (e) => e.type === "button" && /rx-comp-toggle__ctl1/.test(e.props?.className || "")
    );
    expect(libBtn2?.props?.disabled).toBeFalsy();
    expect(ctlBtn2?.props?.disabled).toBeFalsy();

    // Simulate clicks
    libBtn2?.props?.onClick?.();
    ctlBtn2?.props?.onClick?.();
    expect(onToggleElementLibrary).toHaveBeenCalled();
    expect(onToggleControlPanel).toHaveBeenCalled();
  });

  test("HeaderRight exports function and includes three action buttons", () => {
    const created: any[] = [];
    installReactStub(created);
    const plugin = loadRenderXPlugin(
      "RenderX/public/plugins/header/right/index.js"
    );
    expect(typeof plugin.HeaderRight).toBe("function");

    created.length = 0;
    plugin.HeaderRight({});
    const previewBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__prev1/.test(e.props?.className || "")
    );
    const fullBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__full1/.test(e.props?.className || "")
    );
    const themeBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(previewBtn).toBeTruthy();
    expect(fullBtn).toBeTruthy();
    expect(themeBtn).toBeTruthy();
  });
});

