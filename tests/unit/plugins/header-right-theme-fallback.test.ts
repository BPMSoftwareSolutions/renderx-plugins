import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

describe("HeaderRight theme switch - fallback when AppShell route not handled", () => {
  test("If play('AppShell','theme-symphony',...) throws, fallback to play('theme-symphony','theme-symphony',...)", () => {
    const created: any[] = [];

    // React stub
    (global as any).window = (global as any).window || {};
    ;(global as any).window.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        const el = { type, props: props || {}, children };
        created.push(el);
        return el;
      },
      useEffect: (_fn: any) => {},
      useState: (init: any) => [init, () => {}],
    } as any;

    // localStorage stub
    const storage: Record<string, string> = { "app-theme": "auto" };
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = String(v); },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    } as any;

    // Conductor where first call throws, second should be used by component
    const play = jest.fn()
      .mockImplementationOnce(() => { throw new Error("No route for AppShell"); })
      .mockImplementation(() => {});
    (global as any).window.renderxCommunicationSystem = { conductor: { play } } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/header/right/index.js");
    plugin.HeaderRight({});

    const themeBtn = created.find((e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || ""));
    expect(themeBtn).toBeTruthy();

    // Click should try AppShell then fallback to theme-symphony
    themeBtn.props.onClick();

    expect(play).toHaveBeenCalledTimes(2);
    expect(play.mock.calls[0][0]).toBe("AppShell");
    expect(play.mock.calls[0][1]).toBe("theme-symphony");
    expect(play.mock.calls[1][0]).toBe("theme-symphony");
    expect(play.mock.calls[1][1]).toBe("theme-symphony");
  });
});

