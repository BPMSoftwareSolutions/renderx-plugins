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

describe("HeaderRight - lazy conductor lookup", () => {
  test("mount without conductor, attach later, then click theme triggers play via lazy getConductor()", () => {
    const created: any[] = [];
    installReactStub(created);

    // No conductor at mount
    (global as any).window.renderxCommunicationSystem = undefined;

    // localStorage stub
    const storage: Record<string, string> = { "app-theme": "auto" };
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] ?? null,
      setItem: (k: string, v: string) => { storage[k] = String(v); },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { for (const k of Object.keys(storage)) delete storage[k]; },
    } as any;

    const plugin: any = loadRenderXPlugin("RenderX/public/plugins/header/right/index.js");
    plugin.HeaderRight({});

    const themeBtn = created.find(
      (e) => e.type === "button" && /rx-comp-button__theme1/.test(e.props?.className || "")
    );
    expect(themeBtn).toBeTruthy();

    // Attach conductor AFTER render
    const play = jest.fn(() => undefined);
    (global as any).window.renderxCommunicationSystem = { conductor: { play } } as any;

    // Click should now pick up the conductor and attempt AppShell + fallback
    themeBtn.props.onClick();
    expect(play).toHaveBeenCalled();
  });
});

