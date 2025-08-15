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

describe("HeaderRight theme switch - play contract with AppShell", () => {
  test("Clicking theme button calls play('AppShell','theme-symphony',{currentTheme,targetTheme,onThemeChange})", () => {
    const created: any[] = [];
    installReactStub(created);

    // Fake conductor and storage
    const play = jest.fn();
    (global as any).window.renderxCommunicationSystem = { conductor: { play } } as any;
    const storage: Record<string, string> = { "app-theme": "auto" };
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = String(v); },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    } as any;

    const plugin = loadRenderXPlugin("RenderX/public/plugins/header/right/index.js");
    plugin.HeaderRight({});

    const themeBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(themeBtn).toBeTruthy();

    // Click: auto -> light, with proper contract
    themeBtn.props.onClick();

    expect(play).toHaveBeenCalled();
    const call = play.mock.calls[0];
    expect(call[0]).toBe("AppShell"); // plugin name
    expect(call[1]).toBe("theme-symphony"); // sequence id
    expect(call[2]).toEqual(
      expect.objectContaining({
        currentTheme: "auto",
        targetTheme: expect.stringMatching(/^(light|dark|auto)$/),
        onThemeChange: expect.any(Function),
      })
    );
  });
});

