import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

function withReactStub<T>(fn: (created: any[]) => T): T {
  const created: any[] = [];
  (global as any).window = (global as any).window || {};
  (global as any).window.React = {
    createElement: (type: any, props: any, ...children: any[]) => {
      const el = { type, props: props || {}, children };
      created.push(el);
      return el;
    },
    useEffect: (_fn: any) => {},
    useState: (init: any) => [init, () => {}],
  } as any;
  return fn(created);
}

describe("Header plugin styling expectations (fail-first)", () => {
  test("HeaderRight should inject CSS for action buttons (background, padding, radius)", () => {
    withReactStub((created) => {
      const plugin = loadRenderXPlugin(
        "RenderX/public/plugins/header/right/index.js"
      );
      plugin.HeaderRight({});

      const styleEl = created.find((e) => e.type === "style");
      const css = (styleEl?.children || []).join("\n");
      expect(styleEl).toBeTruthy(); // should inject styles
      expect(css).toMatch(/\.rx-comp-button__prev1/);
      expect(css).toMatch(/\.rx-comp-button__full1/);
      expect(css).toMatch(/background\s*:/i);
      expect(css).toMatch(/border-radius\s*:\s*\d/);
      expect(css).toMatch(/padding\s*:\s*\d/);
    });
  });

  test("HeaderCenter should inject CSS for toggle buttons (active state)", () => {
    withReactStub((created) => {
      const plugin = loadRenderXPlugin(
        "RenderX/public/plugins/header/center/index.js"
      );
      plugin.HeaderCenter({ showElementLibrary: false, showControlPanel: false });

      const styleEl = created.find((e) => e.type === "style");
      const css = (styleEl?.children || []).join("\n");
      expect(styleEl).toBeTruthy();
      expect(css).toMatch(/\.rx-comp-toggle__lib1/);
      expect(css).toMatch(/\.rx-comp-toggle__ctl1/);
      expect(css).toMatch(/\.active/); // active variant present
    });
  });

  test("HeaderLeft should inject CSS for brand block (title + subtitle spacing)", () => {
    withReactStub((created) => {
      const plugin = loadRenderXPlugin(
        "RenderX/public/plugins/header/left/index.js"
      );
      plugin.HeaderLeft({ hasUnsavedChanges: true });

      const styleEl = created.find((e) => e.type === "style");
      const css = (styleEl?.children || []).join("\n");
      expect(styleEl).toBeTruthy();
      expect(css).toMatch(/\.rx-comp-header-brand__ijkl\s*h1/);
      expect(css).toMatch(/margin/);
      expect(css).toMatch(/font-weight/);
    });
  });
});

