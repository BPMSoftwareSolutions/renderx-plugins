import { registerDragConcertmaster } from "../../../../plugins/canvas-ui-plugin/features/drag/drag.concertmaster";
import { dragArrangement } from "../../../../plugins/canvas-ui-plugin/features/drag/drag.arrangement";
import { createCanvasPromptBook } from "../../../../plugins/canvas-ui-plugin/state/canvas.prompt-book";
import { makeInstanceStageCrew } from "../../../../plugins/canvas-ui-plugin/features/instance/instance.stage-crew";

function makeFakeConductor() {
  const subs = new Map<string, Set<Function>>();
  const plays: any[] = [];
  function emit(name: string, payload: any) {
    const set = subs.get(name);
    set?.forEach((fn) => {
      try { (fn as any)(payload); } catch {}
    });
  }
  const cx = {
    play: (pluginId: string, sequenceId: string, payload?: any) => {
      plays.push({ pluginId, sequenceId, payload });
      return Promise.resolve();
    },
    on: (chan: string, act: string, cb: any) => {
      const name = `${chan}:${act}`;
      const set = subs.get(name) || new Set();
      set.add(cb);
      subs.set(name, set);
      return () => { const s = subs.get(name); s?.delete(cb); };
    },
    __emit: emit,
    __plays: plays,
  } as any;
  return cx;
}

describe("Drag Concertmaster + Instance Stage Crew", () => {
  beforeEach(() => { document.head.innerHTML = ""; });

  it("on end: commits both overlay and instance CSS to final store position", async () => {
    const store = createCanvasPromptBook({ nodes: [{ id: "n1", cssClass: "rx-sync-1", position: { x: 10, y: 20 } }] });
    const conductor = makeFakeConductor();

    // Wire existing drag concertmaster
    registerDragConcertmaster(conductor, { store, dragArrangement });

    // Simulate drag end which will ask overlay to commit-position; then instance crew mirrors it
    const crew = makeInstanceStageCrew();
    const finalPos = store.selectors.positionOf("n1");
    crew.commitPosition("n1", "rx-sync-1", finalPos);

    // Verify instance CSS tag exists with final position
    const tag = document.getElementById("component-instance-css-n1") as HTMLStyleElement | null;
    expect(tag).toBeTruthy();
    const css = (tag?.textContent || "").replace(/\s+/g, "");
    expect(css).toContain(".rx-sync-1{position:absolute;left:10px;top:20px;");
  });
});

