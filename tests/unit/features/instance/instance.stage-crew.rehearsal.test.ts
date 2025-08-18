import { makeInstanceStageCrew } from "../../../../plugins/canvas-ui-plugin/features/instance/instance.stage-crew";

describe("Instance Stage Crew Rehearsal", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("commits position CSS for a component instance", () => {
    const crew = makeInstanceStageCrew();
    crew.commitPosition("n1", "rx-sync-1", { x: 12, y: 34 });

    const tag = document.getElementById("component-instance-css-n1") as HTMLStyleElement | null;
    expect(tag).toBeTruthy();
    const css = (tag?.textContent || "").replace(/\s+/g, "");
    expect(css).toContain(".rx-sync-1{position:absolute;left:12px;top:34px;");
  });
});

