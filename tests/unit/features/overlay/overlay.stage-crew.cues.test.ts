import { makeOverlayStageCrew } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.stage-crew";
import { overlayArrangement } from "../../../../plugins/canvas-ui-plugin/features/overlay/overlay.arrangement";
import { stageEventBus } from "@communication/StageCrew";

describe("Overlay Stage Crew emits stage:cue ops", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("transform emits upsertStyle with transform rule and is batched", async () => {
    const events: any[] = [];
    const unsub = stageEventBus.subscribe("stage:cue", (e) => events.push(e));
    const crew = makeOverlayStageCrew({ upsertStyle() {}, removeStyle() {} } as any, overlayArrangement);

    crew.transform("n1", 3, -2);
    // rAF batching: simulate a frame
    await new Promise((r) => {
      const raf = (globalThis as any).requestAnimationFrame;
      if (typeof raf === "function") raf(() => r(null)); else r(null);
    });

    const cue = events.find((e) => e?.meta?.handlerName === "overlay.transform");
    expect(cue).toBeTruthy();
    expect(cue.ops.some((op: any) => op.type === "upsertStyle" && op.id === "overlay-transform-n1" && String(op.cssText).includes("transform:translate(3px,-2px)"))).toBe(true);
    unsub();
  });

  it("hide/show and commitInstance emit appropriate ops", () => {
    const events: any[] = [];
    const unsub = stageEventBus.subscribe("stage:cue", (e) => events.push(e));
    const crew = makeOverlayStageCrew({ upsertStyle() {}, removeStyle() {} } as any, overlayArrangement);

    crew.hide("n2");
    crew.show("n2");
    crew.commitInstance("n3", { x: 10, y: 20 }, { w: 100, h: 50 });

    const hideCue = events.find((e) => e?.meta?.handlerName === "overlay.hide");
    expect(hideCue).toBeTruthy();
    expect(hideCue.ops.some((op: any) => op.type === "upsertStyle" && op.id === "overlay-visibility-n2" && String(op.cssText).includes("display:none"))).toBe(true);

    const showCue = events.find((e) => e?.meta?.handlerName === "overlay.show");
    expect(showCue).toBeTruthy();
    expect(showCue.ops.some((op: any) => op.type === "remove" && op.selector === "#overlay-visibility-n2")).toBe(true);

    const instCue = events.find((e) => e?.meta?.handlerName === "overlay.commitInstance");
    expect(instCue).toBeTruthy();
    expect(instCue.ops.some((op: any) => op.type === "upsertStyle" && op.id === "overlay-instance-n3" && String(op.cssText).includes("left:10px") && String(op.cssText).includes("top:20px"))).toBe(true);

    unsub();
  });
});

