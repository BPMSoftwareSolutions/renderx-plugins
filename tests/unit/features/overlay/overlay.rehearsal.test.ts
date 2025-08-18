// Overlay Arrangement to be implemented under features/overlay
// In rehearsals, we test the pure rules first
import { overlayArrangement } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.arrangement";
import { makeOverlayStageCrew } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.stage-crew";

// A minimal cssAdapter mock kept for signature but actual writes route via Stage Crew
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

  it("Stage Crew emits cues for transform/hide/show/commit with arrangement rules", async () => {
    const { stageEventBus } = await import("@communication/StageCrew");
    const events: any[] = [];
    const unsub = stageEventBus.subscribe("stage:cue", (e) => events.push(e));

    const crew = makeOverlayStageCrew(cssAdapter as any, overlayArrangement);

    crew.transform("el1", 3, 7);
    await new Promise((r) => {
      const raf = (globalThis as any).requestAnimationFrame;
      if (typeof raf === "function") raf(() => r(null));
      else r(null);
    });

    const tCue = events.find(
      (e) => e?.meta?.handlerName === "overlay.transform"
    );
    expect(tCue).toBeTruthy();
    expect(
      tCue.ops.some(
        (op: any) =>
          op.type === "upsertStyle" &&
          op.id === "overlay-transform-el1" &&
          String(op.cssText).includes("transform:translate(3px,7px)")
      )
    ).toBe(true);

    crew.hide("el1");
    const hCue = events.find((e) => e?.meta?.handlerName === "overlay.hide");
    expect(hCue).toBeTruthy();
    expect(
      hCue.ops.some(
        (op: any) =>
          op.type === "upsertStyle" &&
          op.id === "overlay-visibility-el1" &&
          String(op.cssText).includes("display:none")
      )
    ).toBe(true);

    crew.show("el1");
    const sCue = events.find((e) => e?.meta?.handlerName === "overlay.show");
    expect(sCue).toBeTruthy();
    expect(
      sCue.ops.some(
        (op: any) =>
          op.type === "remove" && op.selector === "#overlay-visibility-el1"
      )
    ).toBe(true);

    crew.commitInstance("el1", { x: 5, y: 6 }, { w: 10, h: 11 });
    const cCue = events.find(
      (e) => e?.meta?.handlerName === "overlay.commitInstance"
    );
    expect(cCue).toBeTruthy();
    expect(
      cCue.ops.some(
        (op: any) =>
          op.type === "upsertStyle" &&
          op.id === "overlay-instance-el1" &&
          String(op.cssText).includes("left:5px")
      )
    ).toBe(true);

    unsub();
  });
});
