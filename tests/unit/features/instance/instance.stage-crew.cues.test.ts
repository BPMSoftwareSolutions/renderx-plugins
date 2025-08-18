import { makeInstanceStageCrew } from "../../../../plugins/canvas-ui-plugin/features/instance/instance.stage-crew";
import { stageEventBus } from "@communication/StageCrew";

describe("Instance Stage Crew emits stage:cue ops", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("commitPosition routes DOM write via StageCrew upsertStyle and emits cue", async () => {
    const events: any[] = [];
    const unsub = stageEventBus.subscribe("stage:cue", (e) => events.push(e));

    const crew = makeInstanceStageCrew();
    crew.commitPosition("n1", "rx-sync-1", { x: 12, y: 34 });

    // No batching expected; commit should be synchronous
    expect(events.length).toBe(1);
    const cue = events[0];
    expect(cue?.ops?.some?.((op: any) => op.type === "upsertStyle" && op.id === "component-instance-css-n1" && String(op.cssText || "").includes("left:12px") && String(op.cssText || "").includes("top:34px"))).toBe(true);

    // Also validate DOM is updated as a side-effect of StageCrew apply
    const tag = document.getElementById("component-instance-css-n1") as HTMLStyleElement | null;
    expect(tag).toBeTruthy();
    const css = (tag?.textContent || "").replace(/\s+/g, "");
    expect(css).toContain(".rx-sync-1{position:absolute;left:12px;top:34px;");

    unsub();
  });
});

