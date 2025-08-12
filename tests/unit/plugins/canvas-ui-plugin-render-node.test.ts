import { loadRenderXPlugin } from "../../../utils/renderx-plugin-loader";
import {
  buildExpectedHTML,
  buildExpectedInstanceCSS,
} from "../../../utils/dom-templates";

const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/index.js";

describe("Canvas UI Plugin - renderCanvasNode pure element rendering", () => {
  test("renderCanvasNode returns a pure <button> element (no wrapper), injects CSS (including instance CSS), and uses no inline styles", () => {
    const created: Array<{ type: any; props: any; children: any[] }> = [];

    // Reset head styles
    while (document.head.firstChild)
      document.head.removeChild(document.head.firstChild);

    const originalWindow: any = (global as any).window;
    const w: any = originalWindow || {};

    // React stub that records element creations
    w.React = {
      createElement: (type: any, props: any, ...children: any[]) => {
        created.push({ type, props, children });
        return { type, props, children };
      },
      useEffect: (fn: any) => fn(),
      useState: (init: any) => [init, () => {}],
    };

    (global as any).window = w;

    try {
      const plugin: any = loadRenderXPlugin(pluginPath);
      expect(typeof plugin.renderCanvasNode).toBe("function");

      const node = {
        id: "rx-comp-button-abcde",
        cssClass: "rx-comp-button-abcde",
        type: "button",
        position: { x: 100, y: 40 },
        component: {
          metadata: { name: "Button", type: "button" },
          ui: {
            template:
              '<button class="rx-button rx-button--{{variant}} rx-button--{{size}}">{{content}}</button>',
            styles: {
              css: ".rx-button{background:#123;color:#fff;border:1px solid #123;}",
            },
          },
          integration: {
            canvasIntegration: { defaultWidth: 90, defaultHeight: 28 },
          },
        },
        // expected tokens to resolve to these values (used by test expected builder)
        variant: "primary",
        size: "md",
        content: "Button",
        width: 90,
        height: 28,
      };

      const el = plugin.renderCanvasNode(node);

      // First created element should be the actual <button>
      expect(created.length).toBeGreaterThan(0);
      const first = created[0];
      expect(first.type).toBe("button");

      // Ensure id/class applied on <button>
      const props = first.props || {};
      expect(props.id).toBe(node.id);
      const className = String(props.className || "");
      const expectedClassMatch = buildExpectedHTML({
        id: node.id,
        cssClass: node.cssClass,
        type: node.type,
        position: node.position,
        variant: node.variant,
        size: node.size,
        content: node.content,
      }).match(/class=\"([^\"]+)\"/);
      const expectedClass = expectedClassMatch ? expectedClassMatch[1] : "";
      expect(className.trim().split(/\s+/).sort()).toEqual(
        expectedClass.trim().split(/\s+/).sort()
      );

      // No inline styling allowed; all layout and look must be via CSS classes
      expect(props.style == null || Object.keys(props.style).length === 0).toBe(
        true
      );

      // CSS injected: component CSS and instance CSS rule for this id/class
      const styleTags = Array.from(
        document.head.querySelectorAll("style")
      ) as HTMLStyleElement[];
      expect(styleTags.length).toBeGreaterThan(0);
      expect(
        styleTags.some((s) => /\.rx-button\s*\{/.test(s.textContent || ""))
      ).toBe(true);

      // Instance CSS must equal expected for this instance (id-specific style tag)
      const instTag = document.getElementById(
        `component-instance-css-${node.id}`
      ) as HTMLStyleElement | null;
      expect(instTag).toBeTruthy();
      const instCss = (instTag?.textContent || "").replace(/\s+/g, "");
      expect(instCss).toContain(
        `.${node.cssClass}{position:absolute;left:100px;top:40px;box-sizing:border-box;display:block;}`.replace(
          /\s+/g,
          ""
        )
      );
      expect(instCss).toContain(
        `.${node.cssClass}{width:90px;}`.replace(/\s+/g, "")
      );
      expect(instCss).toContain(
        `.${node.cssClass}{height:28px;}`.replace(/\s+/g, "")
      );

      // No wrapper divs around it created by plugin layer
      expect(
        created.find(
          (e) => e.type === "div" && e.props?.className === "component-inner"
        )
      ).toBeUndefined();
    } finally {
      (global as any).window = originalWindow;
    }
  });
});

test("injects component CSS exactly as defined in json-component (all declarations present)", () => {
  const created: Array<{ type: any; props: any; children: any[] }> = [];

  // Reset head styles
  while (document.head.firstChild)
    document.head.removeChild(document.head.firstChild);

  const originalWindow: any = (global as any).window;
  const w: any = originalWindow || {};

  // React stub
  w.React = {
    createElement: (type: any, props: any, ...children: any[]) => {
      created.push({ type, props, children });
      return { type, props, children };
    },
    useEffect: (fn: any) => fn(),
    useState: (init: any) => [init, () => {}],
  };

  (global as any).window = w;

  try {
    const plugin: any = loadRenderXPlugin(pluginPath);
    expect(typeof plugin.renderCanvasNode).toBe("function");

    const css = `
.rx-button {
  background: #135;
  color: #eee;
  border: 2px dashed #f00;
  padding: 6px 10px;
}`;

    const node: any = {
      id: "rx-comp-button-zzzzz",
      cssClass: "rx-comp-button-zzzzz",
      type: "button",
      position: { x: 10, y: 20 },
      component: {
        metadata: { name: "Button", type: "button" },
        ui: {
          template:
            '<button class="rx-button rx-button--{{variant}} rx-button--{{size}}">{{content}}</button>',
          styles: { css },
        },
        integration: {
          canvasIntegration: { defaultWidth: 120, defaultHeight: 40 },
        },
      },
      variant: "warning",
      size: "lg",
      content: "Button",
    };

    plugin.renderCanvasNode(node);

    // Verify classes resolved on element
    const first = created[0];
    const className = String(first?.props?.className || "");
    expect(className).toContain("rx-button");
    expect(className).toContain("rx-button--warning");
    expect(className).toContain("rx-button--lg");
    expect(className.includes("{{")).toBe(false);

    // Verify component CSS injected with all declarations
    const styleTags = Array.from(document.head.querySelectorAll("style"));
    const cssTag = styleTags.find((s) =>
      (s.textContent || "").includes(".rx-button")
    );
    expect(cssTag).toBeTruthy();
    const text = cssTag!.textContent || "";
    const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase();
    expect(norm(text)).toContain(".rx-button {");
    expect(/background\s*:\s*#135/i.test(text)).toBe(true);
    expect(/color\s*:\s*#eee/i.test(text)).toBe(true);
    expect(/border\s*:\s*2px\s*dashed\s*#f00/i.test(text)).toBe(true);
    expect(/padding\s*:\s*6px\s*10px/i.test(text)).toBe(true);

    // No inline styles used on the element
    expect(
      first?.props?.style == null ||
        Object.keys(first?.props?.style || {}).length === 0
    ).toBe(true);
  } finally {
    (global as any).window = originalWindow;
  }
});
