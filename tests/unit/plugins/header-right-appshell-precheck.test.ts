import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function installReactStub(created: any[]) {
  const ReactStub = {
    createElement: (type: any, props: any, ...children: any[]) => {
      const el = { type, props: props || {}, children };
      created.push(el);
      return el;
    },
    useEffect: (_fn: any) => {},
    useState: (init: any) => [init, () => {}],
  } as any;
  (global as any).window = (global as any).window || {};
  (global as any).window.React = ReactStub;
}

describe("HeaderRight - precheck AppShell presence", () => {
  test("If AppShell not mounted, do not attempt AppShell; call theme-symphony directly", () => {
    const created: any[] = [];
    installReactStub(created);

    // localStorage stub
    const storage: Record<string, string> = { "app-theme": "auto" };
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = String(v); },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    } as any;

    // Conductor without AppShell; exposes getMountedPluginIds
    const play = jest.fn(() => undefined);
    const getMountedPluginIds = jest.fn(() => [
      "theme-symphony",
      "Canvas.component-create-symphony",
    ]);
    (global as any).window.renderxCommunicationSystem = { conductor: { play, getMountedPluginIds } } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/header/right/index.js");
    plugin.HeaderRight({});

    const themeBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(themeBtn).toBeTruthy();

    themeBtn.props.onClick();

    expect(getMountedPluginIds).toHaveBeenCalled();
    const calls = play.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // First call should be theme-symphony route, not AppShell
    expect(calls[0][0]).toBe("theme-symphony");
    expect(calls[0][1]).toBe("theme-symphony");
    // Ensure AppShell was not called at all
    const anyAppShell = calls.some((c: any[]) => c[0] === "AppShell");
    expect(anyAppShell).toBe(false);
  });
});

