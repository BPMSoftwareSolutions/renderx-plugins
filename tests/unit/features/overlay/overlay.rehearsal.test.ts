// Overlay Arrangement to be implemented under features/overlay
// In rehearsals, we test the pure rules first
import { overlayArrangement } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.arrangement";
import { makeOverlayStageCrew } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.stage-crew";

// A minimal cssAdapter mock to verify StageCrew behavior
const cssAdapter = {
  upsertStyle: jest.fn(),
  removeStyle: jest.fn(),
};

describe("Overlay Rehearsal", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    cssAdapter.upsertStyle.mockClear();
    cssAdapter.removeStyle.mockClear();
  });

  it("arrangement builds transform rule", () => {
    const css = overlayArrangement.transformRule("abc", 5.2, -3.7);
    expect(css).toContain(".rx-overlay-abc");
    expect(css).toContain("transform:translate(5px,-4px)");
  });

  it("arrangement builds hide/show rules", () => {
    const hide = overlayArrangement.hideRule("xyz");
    expect(hide).toContain(".rx-overlay-xyz");
    expect(hide).toContain("display:none");

    // show is implemented by removing the style via StageCrew
  });

  it("arrangement builds instance rule with position and size", () => {
    const css = overlayArrangement.instanceRule(
      "n1",
      { x: 10, y: 20 },
      { w: 100, h: 80 }
    );
    expect(css).toContain(".rx-overlay-n1");
    expect(css).toContain("left:10px");
    expect(css).toContain("top:20px");
    expect(css).toContain("width:100px");
    expect(css).toContain("height:80px");
  });

  it("stage crew can transform/hide/show/commit via cssAdapter with arrangement rules", () => {
    const crew = makeOverlayStageCrew(cssAdapter, overlayArrangement);

    crew.transform("el1", 3, 7);
    expect(cssAdapter.upsertStyle).toHaveBeenCalledWith(
      "overlay-transform-el1",
      expect.stringContaining("transform:translate(3px,7px)")
    );

    crew.hide("el1");
    expect(cssAdapter.upsertStyle).toHaveBeenCalledWith(
      "overlay-visibility-el1",
      expect.stringContaining("display:none")
    );

    crew.show("el1");
    expect(cssAdapter.removeStyle).toHaveBeenCalledWith(
      "overlay-visibility-el1"
    );

    crew.commitInstance("el1", { x: 5, y: 6 }, { w: 10, h: 11 });
    expect(cssAdapter.upsertStyle).toHaveBeenCalledWith(
      "overlay-instance-el1",
      expect.stringContaining("left:5px")
    );
  });
});
