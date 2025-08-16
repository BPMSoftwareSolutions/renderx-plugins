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

describe("HeaderRight theme switch - fallback when AppShell returns non-promise without throwing", () => {
  test("If play('AppShell', ...) returns undefined (no throw), immediately fallback to play('theme-symphony','theme-symphony',...)", () => {
    const created: any[] = [];
    installReactStub(created);

    // localStorage stub
    const storage: Record<string, string> = { "app-theme": "auto" };
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

    // Conductor where first call does NOT throw and returns undefined
    const play = jest.fn().mockImplementation(() => undefined);
    (global as any).window.renderxCommunicationSystem = { conductor: { play } } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/header/right/index.js");
    plugin.HeaderRight({});

    const themeBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(themeBtn).toBeTruthy();

    // Click should call AppShell first, then immediately fallback to theme-symphony
    themeBtn.props.onClick();

    expect(play).toHaveBeenCalled();
    const calls = play.mock.calls;
    expect(calls[0][0]).toBe("AppShell");
    expect(calls[0][1]).toBe("theme-symphony");
    // Fallback call
    expect(calls[1][0]).toBe("theme-symphony");
    expect(calls[1][1]).toBe("theme-symphony");
  });
});

