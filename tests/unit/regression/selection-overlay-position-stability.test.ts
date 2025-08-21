/**
 * REGRESSION TEST: Verifies that selecting a component does NOT change its position.
 * 
 * This guards against the bug where overlay CSS or StageCrew operations reset 
 * component position to (0,0), causing components to "jump" to top-left on selection.
 * 
 * Issue: https://github.com/BPMSoftwareSolutions/renderx-plugins/issues/28
 */

import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";

// Mock overlay styles to avoid DOM/CSS complexity in unit tests
jest.mock("../../../plugins/canvas-ui-plugin/constants/overlayCss.js", () => ({
  buildOverlayGlobalCssText: () => "/* global overlay styles */",
  buildOverlayInstanceCssText: (node: any, w: number, h: number) => `
    /* Overlay styles for ${node.id} - should NOT target component directly */
    .rx-overlay-${node.id} {
      position: absolute;
      left: ${node.position?.x || 0}px;
      top: ${node.position?.y || 0}px;
      width: ${w}px;
      height: ${h}px;
      z-index: 10;
    }
  `,
}));

function createStageCrewMock() {
  const ops: any[] = [];
  return {
    ops,
    beginBeat: (corrId: string, meta: any) => {
      const txn = {
        remove: (selector: string) => {
          const element = document.querySelector(selector);
          if (element) {
            element.remove();
          }
          ops.push({ type: "remove", selector });
          return txn;
        },
        create: (tagName: string, options: any) => {
          const element = document.createElement(tagName);
          if (options?.attrs) {
            Object.entries(options.attrs).forEach(([key, value]) => {
              element.setAttribute(key, value as string);
            });
          }
          ops.push({ type: "create", tagName, options, element });
          return {
            appendTo: (parent: string) => {
              if (parent === "head") {
                document.head.appendChild(element);
              } else if (parent === "body") {
                document.body.appendChild(element);
              }
              ops.push({ type: "appendTo", parent });
              return txn;
            }
          };
        },
        update: (selector: string, payload: any) => {
          const element = document.querySelector(selector);
          if (element && payload) {
            // Apply class changes
            if (payload.classes?.add) {
              payload.classes.add.forEach((cls: string) => element.classList.add(cls));
            }
            if (payload.classes?.remove) {
              payload.classes.remove.forEach((cls: string) => element.classList.remove(cls));
            }
            // Apply style changes
            if (payload.style) {
              Object.entries(payload.style).forEach(([prop, value]) => {
                (element as HTMLElement).style.setProperty(prop, value as string);
              });
            }
            // Apply text content
            if (payload.text !== undefined) {
              element.textContent = payload.text;
            }
          }
          ops.push({ type: "update", selector, payload });
          return txn;
        },
        commit: (options?: any) => {
          ops.push({ type: "commit", options });
          return undefined;
        },
      };
      ops.push({ type: "beginBeat", corrId, meta });
      return txn;
    },
  };
}

describe("REGRESSION: Selection overlay position stability", () => {
  let selectionPlugin: any;
  
  beforeEach(() => {
    // Load the selection plugin
    selectionPlugin = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");
    
    // Reset DOM
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  it("✅ NEUTRALIZED: injectInstanceCSS is now a no-op (no geometry injection)", () => {
    // This test verifies the complete neutralization per second code review
    const { injectInstanceCSS } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/utils/styles.js");

    // Arrange: Clean state
    document.head.innerHTML = "";
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Act: Call injectInstanceCSS with any parameters
    const nodeWithPosition = {
      id: "rx-comp-button-test123",
      cssClass: "rx-comp-button",
      position: { x: 120, y: 80 }
    };

    injectInstanceCSS(nodeWithPosition, 96, 40);

    // Assert: No CSS tag should be created (complete neutralization)
    const instanceCssTag = document.getElementById("component-instance-css-rx-comp-button-test123");
    expect(instanceCssTag).toBeNull(); // No tag created - function is neutralized

    // Assert: Warning should be logged about deprecation
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("injectInstanceCSS is deprecated and neutralized")
    );

    consoleSpy.mockRestore();
  });

  it("✅ NEUTRALIZED: injectInstanceCSS never creates geometry CSS regardless of input", () => {
    // This test ensures the function is completely neutralized for all scenarios
    const { injectInstanceCSS } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/utils/styles.js");

    // Arrange: Clean state
    document.head.innerHTML = "";
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Act: Try various scenarios that previously would have created CSS
    const scenarios = [
      { id: "test1", cssClass: "rx-comp-button", position: { x: 100, y: 50 } },
      { id: "test2", cssClass: "rx-comp-input" }, // no position
      { cssClass: "rx-comp-text" }, // no id, no position
    ];

    scenarios.forEach(node => {
      injectInstanceCSS(node, 120, 40);
    });

    // Assert: No CSS tags should be created for any scenario
    const allStyleTags = document.head.querySelectorAll('style[id^="component-instance-css-"]');
    expect(allStyleTags.length).toBe(0); // No geometry CSS created

    // Assert: Function was called and warned for each scenario
    expect(consoleSpy).toHaveBeenCalledTimes(3);

    consoleSpy.mockRestore();
  });

  it("✅ WORKING: updateInstancePositionCSSViaStageCrew uses provided position correctly", () => {
    // Test that StageCrew variant works correctly when position is provided
    const { updateInstancePositionCSSViaStageCrew } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    // Arrange: Existing instance CSS at (200, 150)
    document.head.innerHTML = `
      <style id="component-instance-css-test789">
        .test789{position:absolute;left:200px;top:150px;width:120px;height:32px;}
      </style>
    `;

    const stageCrew = createStageCrewMock();
    const ctx = { stageCrew };

    // Act: Update position WITH providing position data (correct usage)
    updateInstancePositionCSSViaStageCrew(ctx, "test789", "test789", 100, 50);
    // NOTE: Position is provided as x=100, y=50 - should use these values

    // Assert: Check if new CSS was created with provided position
    const newInstanceCssTag = document.getElementById("component-instance-css-test789");
    expect(newInstanceCssTag).toBeTruthy();

    if (newInstanceCssTag) {
      const cssText = newInstanceCssTag.textContent || "";
      console.log("Updated CSS via StageCrew:", cssText);

      // Should use the provided position (100, 50)
      expect(cssText).toContain("left:100px");
      expect(cssText).toContain("top:50px");
      expect(cssText).not.toContain("left:0px");   // Should NOT default to 0
      expect(cssText).not.toContain("top:0px");    // Should NOT default to 0
      expect(cssText).not.toContain("left:200px"); // Should NOT preserve old position
      expect(cssText).not.toContain("top:150px");  // Should NOT preserve old position
    }
  });

  it("✅ WORKING: updateInstancePositionCSSViaStageCrew interprets parameters as position", () => {
    // Test that the position update function correctly interprets x,y parameters as position
    const { updateInstancePositionCSSViaStageCrew } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    // Arrange: Existing instance CSS at (200, 150)
    document.head.innerHTML = `
      <style id="component-instance-css-test789">
        .test789{position:absolute;left:200px;top:150px;width:120px;height:32px;}
      </style>
    `;

    const stageCrew = createStageCrewMock();
    const ctx = { stageCrew };

    // Act: Update position with x=100, y=50 parameters
    updateInstancePositionCSSViaStageCrew(ctx, "test789", "test789", 100, 50);
    // NOTE: The function signature is (ctx, id, cls, x, y) - so 100,50 are the new position

    // Assert: Check if new CSS uses the provided position
    const newInstanceCssTag = document.getElementById("component-instance-css-test789");
    expect(newInstanceCssTag).toBeTruthy();

    if (newInstanceCssTag) {
      const cssText = newInstanceCssTag.textContent || "";
      console.log("Updated CSS:", cssText);

      // Should use the provided position (100, 50)
      expect(cssText).toContain("left:100px");
      expect(cssText).toContain("top:50px");
      expect(cssText).not.toContain("left:0px");   // Should NOT default to 0
      expect(cssText).not.toContain("top:0px");    // Should NOT default to 0
      expect(cssText).not.toContain("left:200px"); // Should NOT preserve old position
      expect(cssText).not.toContain("top:150px");  // Should NOT preserve old position
    }
  });

  it("✅ WORKING: updateInstanceSizeCSSViaStageCrew preserves position from existing tag", () => {
    // Test that StageCrew size variant preserves position correctly
    const { updateInstanceSizeCSSViaStageCrew } = loadRenderXPlugin("RenderX/public/plugins/canvas-ui-plugin/index.js");

    // Arrange: Existing instance CSS at (200, 150)
    document.head.innerHTML = `
      <style id="component-instance-css-test789">
        .test789{position:absolute;left:200px;top:150px;width:120px;height:32px;}
      </style>
    `;

    const existingTag = document.getElementById("component-instance-css-test789");
    expect(existingTag).toBeTruthy();
    expect(existingTag!.textContent).toContain("left:200px");
    expect(existingTag!.textContent).toContain("top:150px");

    const stageCrew = createStageCrewMock();
    const ctx = { stageCrew };

    // Act: Update size without providing position data
    // This should preserve position from existing tag
    updateInstanceSizeCSSViaStageCrew(ctx, "test789", "test789", 140, 50);
    // NOTE: No position parameter provided - should preserve from existing tag

    // Assert: Check if new CSS preserves position from existing tag
    const newInstanceCssTag = document.getElementById("component-instance-css-test789");
    expect(newInstanceCssTag).toBeTruthy();

    if (newInstanceCssTag) {
      const cssText = newInstanceCssTag.textContent || "";
      console.log("Updated CSS via StageCrew:", cssText);

      // Should preserve position from existing tag
      expect(cssText).toContain("left:200px"); // Position preserved
      expect(cssText).toContain("top:150px");  // Position preserved
      expect(cssText).toContain("width:140px"); // New width applied
      expect(cssText).toContain("height:50px"); // New height applied
      expect(cssText).not.toContain("left:0px");   // Should NOT default to 0
      expect(cssText).not.toContain("top:0px");    // Should NOT default to 0
    }
  });
});

describe("COMPREHENSIVE REGRESSION TESTS (Second Code Review)", () => {
  let selectionPlugin: any;
  let stageCrew: any;

  beforeEach(() => {
    // Clean DOM state
    document.head.innerHTML = "";
    document.body.innerHTML = "";

    // Load selection plugin
    selectionPlugin = loadRenderXPlugin("RenderX/public/plugins/canvas-selection-plugin/index.js");

    // Create StageCrew mock that actually applies DOM changes
    stageCrew = createStageCrewMock();
  });

  it("(1) No Geometry Mutation on Select - Component position unchanged", () => {
    // Arrange DOM with positioned component
    const el = document.createElement('div');
    el.id = 'rx-123';
    el.className = 'rx-comp-button';
    el.style.position = 'absolute';
    el.style.left = '240px';
    el.style.top = '120px';
    document.body.appendChild(el);

    // Arrange StageCrew context
    const ctx = {
      stageCrew,
      sequence: { id: 'test-sequence' },
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
    };

    // Act: Select component
    selectionPlugin.handlers.handleSelect({ elementId: 'rx-123' }, ctx);

    // Assert: Component geometry unchanged
    expect(el.style.left).toBe('240px');
    expect(el.style.top).toBe('120px');
    expect(el.style.position).toBe('absolute');

    // Assert: Selection class added
    expect(el.classList.contains('rx-comp-selected')).toBe(true);

    // Assert: No component-instance-css tag was added (neutralized)
    const componentCssTags = [...document.head.querySelectorAll('style,link')]
      .filter(n => (n.id || '').startsWith('component-instance-css-'));
    expect(componentCssTags.length).toBe(0);
  });

  it("(2) Guardrail: No legacy geometry CSS injection for components", () => {
    // Arrange: Component and selection
    document.body.innerHTML = `<div id="rx-456" class="rx-comp-input" style="position:absolute;left:100px;top:50px;">Input</div>`;
    const ctx = { stageCrew, sequence: { id: 'test' } };

    // Act: Perform selection
    selectionPlugin.handlers.handleSelect({ elementId: 'rx-456' }, ctx);

    // Assert: Scan all CSS for geometry rules targeting component classes
    const allCssTexts = [
      ...document.head.querySelectorAll('style'),
      ...document.head.querySelectorAll('link[href^="data:text/css"]')
    ].map(el => {
      if (el.tagName === 'STYLE') return el.textContent || '';
      if (el.tagName === 'LINK') {
        const href = el.getAttribute('href') || '';
        return decodeURIComponent(href.replace(/^data:text\/css[^,]*,/, ''));
      }
      return '';
    }).join('\n');

    // Check for geometry rules targeting COMPONENT classes (should not exist)
    // Note: Overlay CSS (.rx-overlay-*) is allowed and expected to have position rules
    const componentGeometryRule = /\.(?!rx-overlay-)([A-Za-z0-9_-]+)\s*\{[^}]*position\s*:\s*absolute;[^}]*left\s*:\s*\d+px;[^}]*top\s*:\s*\d+px;/;
    const match = allCssTexts.match(componentGeometryRule);
    if (match) {
      console.log("Found COMPONENT geometry rule (this is bad):", match[0]);
      console.log("All CSS texts:", allCssTexts);
    }
    expect(componentGeometryRule.test(allCssTexts)).toBe(false);
  });

  it("(3) Missing position handling: No geometry CSS even when node.position undefined", () => {
    // Arrange: Component in DOM
    document.body.innerHTML = `<div id="rx-789" class="rx-comp-text">Text</div>`;
    const ctx = { stageCrew, sequence: { id: 'test' } };

    // Act: Select with undefined position (common edge case)
    selectionPlugin.handlers.handleSelect({
      elementId: 'rx-789',
      position: undefined
    }, ctx);

    // Assert: No geometry CSS injection occurred
    const componentCssTags = [...document.head.querySelectorAll('style,link')]
      .filter(n => (n.id || '').includes('component-instance-css'));
    expect(componentCssTags.length).toBe(0);

    // Assert: Component still selectable (class added)
    const el = document.getElementById('rx-789');
    expect(el?.classList.contains('rx-comp-selected')).toBe(true);
  });

  it("(4) StageCrew API parity: Uses txn.update, not deprecated upsertStyleTag", () => {
    // Arrange: Component
    document.body.innerHTML = `<div id="rx-999" class="rx-comp-button">Button</div>`;
    const ctx = { stageCrew, sequence: { id: 'test' } };

    // Act: Perform selection
    selectionPlugin.handlers.handleSelect({ elementId: 'rx-999' }, ctx);

    // Assert: StageCrew txn.update was used
    expect(stageCrew.ops.some((op: any) => op.type === 'update')).toBe(true);

    // Assert: No deprecated upsertStyleTag method exists or was called
    expect((stageCrew as any).upsertStyleTag).toBeUndefined();
    expect(stageCrew.ops.some((op: any) => op.type === 'upsertStyleTag')).toBe(false);
  });
});
