import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

/**
 * Test StageCrew-based instance CSS functions for CIA/SPA compliance
 * Verifies instance CSS updates are handled via StageCrew instead of direct DOM manipulation
 */

describe("Canvas UI Plugin - Instance CSS StageCrew Compliance", () => {
  const pluginPath = "RenderX/public/plugins/canvas-ui-plugin/index.js";

  function makeStageCrewRecorder() {
    const ops: any[] = [];
    const beginBeat = (correlationId: string, meta?: any) => {
      const txn = {
        create: (tag: string, opts: any) => {
          const record = { type: "create", tag, ...opts };
          return {
            appendTo: (parent: string) => {
              ops.push({ ...record, parent });
              return txn;
            },
          };
        },
        remove: (selector: string) => {
          ops.push({ type: "remove", selector });
          return txn;
        },
        update: (selector: string, payload: any) => {
          ops.push({ type: "update", selector, payload });
          return txn;
        },
        commit: (options?: { batch?: boolean }) => {
          ops.push({ type: "commit", options });
        },
      };
      return txn;
    };
    return { ops, beginBeat };
  }

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  test("updateInstancePositionCSSViaStageCrew uses StageCrew create/update operations", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.updateInstancePositionCSSViaStageCrew(
      { stageCrew: { beginBeat } },
      "test-element",
      "rx-comp-button",
      100,
      50
    );

    // Should remove existing, create new style tag, and update its content
    const removes = ops.filter((o) => o.type === "remove");
    expect(removes).toHaveLength(1);
    expect(removes[0].selector).toBe("#component-instance-css-test-element");

    const creates = ops.filter((o) => o.type === "create");
    expect(creates).toHaveLength(1);
    expect(creates[0].tag).toBe("style");
    expect(creates[0].attrs.id).toBe("component-instance-css-test-element");
    expect(creates[0].parent).toBe("head");

    const updates = ops.filter((o) => o.type === "update");
    expect(updates).toHaveLength(1);
    expect(updates[0].selector).toBe("#component-instance-css-test-element");
    expect(updates[0].payload.text).toContain(".rx-comp-button{position:absolute;left:100px;top:50px;");

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("updateInstanceSizeCSSViaStageCrew uses StageCrew create/update operations", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.updateInstanceSizeCSSViaStageCrew(
      { stageCrew: { beginBeat } },
      "test-element",
      "rx-comp-button",
      120,
      40,
      { x: 10, y: 20 }
    );

    // Should remove existing, create new style tag, and update its content
    const removes = ops.filter((o) => o.type === "remove");
    expect(removes).toHaveLength(1);
    expect(removes[0].selector).toBe("#component-instance-css-test-element");

    const creates = ops.filter((o) => o.type === "create");
    expect(creates).toHaveLength(1);
    expect(creates[0].tag).toBe("style");
    expect(creates[0].attrs.id).toBe("component-instance-css-test-element");
    expect(creates[0].parent).toBe("head");

    const updates = ops.filter((o) => o.type === "update");
    expect(updates).toHaveLength(1);
    expect(updates[0].selector).toBe("#component-instance-css-test-element");

    const cssText = updates[0].payload.text;
    expect(cssText).toContain(".rx-comp-button{position:absolute;left:10px;top:20px;");
    expect(cssText).toContain(".rx-comp-button{width:120px;}");
    expect(cssText).toContain(".rx-comp-button{height:40px;}");

    expect(ops.some((o) => o.type === "commit")).toBe(true);
  });

  test("StageCrew functions preserve existing dimensions when updating position", () => {
    const mod: any = loadRenderXPlugin(pluginPath);

    // Create existing style tag with width/height
    const existingTag = document.createElement("style");
    existingTag.id = "component-instance-css-test-element";
    existingTag.textContent = ".rx-comp-button{width:200px;} .rx-comp-button{height:80px;}";
    document.head.appendChild(existingTag);

    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.updateInstancePositionCSSViaStageCrew(
      { stageCrew: { beginBeat } },
      "test-element",
      "rx-comp-button",
      150,
      75
    );

    const update = ops.find((o) => o.type === "update");
    const cssText = update.payload.text;
    expect(cssText).toContain("width:200px");
    expect(cssText).toContain("height:80px");
    expect(cssText).toContain("left:150px;top:75px");
  });

  test("StageCrew functions preserve existing position when updating size", () => {
    const mod: any = loadRenderXPlugin(pluginPath);
    
    // Create existing style tag with position
    const existingTag = document.createElement("style");
    existingTag.id = "component-instance-css-test-element";
    existingTag.textContent = ".rx-comp-button{position:absolute;left:300px;top:200px;}";
    document.head.appendChild(existingTag);

    const { ops, beginBeat } = makeStageCrewRecorder();

    mod.updateInstanceSizeCSSViaStageCrew(
      { stageCrew: { beginBeat } },
      "test-element",
      "rx-comp-button",
      180,
      60,
      null // no position override
    );

    const update = ops.find((o) => o.type === "update");
    const cssText = update.payload.text;
    expect(cssText).toContain("left:300px;top:200px");
    expect(cssText).toContain("width:180px");
    expect(cssText).toContain("height:60px");
  });

  test("StageCrew functions are resilient to missing context", () => {
    const mod: any = loadRenderXPlugin(pluginPath);

    expect(() => {
      mod.updateInstancePositionCSSViaStageCrew(null, "test", "cls", 10, 20);
    }).not.toThrow();

    expect(() => {
      mod.updateInstanceSizeCSSViaStageCrew({}, "test", "cls", 100, 50);
    }).not.toThrow();
  });
});
