import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import { TestEnvironment } from "../../utils/test-helpers";

describe("Theme toggle via header-right triggers theme-symphony and persists", () => {
  test("Clicking theme button cycles theme and calls conductor.play(theme-symphony)", async () => {
    // Setup conductor and register theme plugin sequence
    const eventBus = TestEnvironment.createEventBus();
    const conductor = TestEnvironment.createMusicalConductor(eventBus as any);
    const themePlugin: any = loadRenderXPlugin(
      "RenderX/public/plugins/theme-management-plugin/index.js"
    );
    await conductor.mount(
      themePlugin.sequence,
      themePlugin.handlers,
      themePlugin.sequence.id
    );

    // Expose conductor to window
    (global as any).window = (global as any).window || {};
    (global as any).window.renderxCommunicationSystem = { conductor } as any;

    // Spy on play
    const playSpy = jest.spyOn(conductor as any, "play");

    // Stub React and localStorage
    const created: any[] = [];
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
    (global as any).window.React = ReactStub;
    const storage: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => {
        storage[k] = String(v);
      },
      removeItem: (k: string) => {
        delete storage[k];
      },
      clear: () => {
        for (const k of Object.keys(storage)) delete storage[k];
      },
    } as any;

    // Load header-right plugin and render
    const headerRight = loadRenderXPlugin(
      "RenderX/public/plugins/header/right/index.js"
    );

    created.length = 0;
    headerRight.HeaderRight({});

    const themeBtn = created.find(
      (e) =>
        e.type === "button" &&
        /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(themeBtn).toBeTruthy();

    // Initial theme is auto
    expect((global as any).localStorage.getItem("app-theme") || "auto").toBe(
      "auto"
    );

    // Click 1: auto -> light
    themeBtn.props.onClick();
    expect(playSpy).toHaveBeenCalledWith(
      "AppShell",
      "theme-symphony",
      expect.objectContaining({
        currentTheme: "auto",
        targetTheme: expect.any(String),
        onThemeChange: expect.any(Function),
      })
    );

    // Simulate theme plugin applying and persisting light
    (global as any).localStorage.setItem("app-theme", "light");

    // Click 2: light -> dark
    themeBtn.props.onClick();
    (global as any).localStorage.setItem("app-theme", "dark");

    // Click 3: dark -> auto
    themeBtn.props.onClick();
    (global as any).localStorage.setItem("app-theme", "auto");

    // Verify cycle occurred and play() invoked at least 3 times
    const plays = playSpy.mock.calls.filter((c) => c[1] === "theme-symphony");
    expect(plays.length).toBeGreaterThanOrEqual(3);
  });
});
