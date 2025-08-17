import { registerInstanceConcertmaster } from "../../../../plugins/canvas-ui-plugin/features/instance/instance.concertmaster";
import { createCanvasPromptBook } from "../../../../plugins/canvas-ui-plugin/state/canvas.prompt-book";
import { makeInstanceStageCrew } from "../../../../plugins/canvas-ui-plugin/features/instance/instance.stage-crew";

describe("Instance Concertmaster Rehearsal", () => {
  function makeFakeConductor() {
    const subs = new Map<string, Set<Function>>();
    function emit(name: string, payload: any) {
      const set = subs.get(name);
      set?.forEach((fn) => {
        try {
          (fn as any)(payload);
        } catch {}
      });
    }
    const cx = {
      on: (chan: string, act: string, cb: any) => {
        const name = `${chan}:${act}`;
        const set = subs.get(name) || new Set();
        set.add(cb);
        subs.set(name, set);
        return () => {
          const s = subs.get(name);
          s?.delete(cb);
        };
      },
      __emit: emit,
    } as any;
    return cx;
  }

  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("commits instance CSS on selection show and drag end from store position", () => {
    const store = createCanvasPromptBook({
      nodes: [{ id: "n1", cssClass: "rx-sync-1", position: { x: 10, y: 20 } }],
    });
    const conductor = makeFakeConductor();
    const crew = makeInstanceStageCrew();

    registerInstanceConcertmaster(conductor, { store, instanceCrew: crew });

    // Selection show → commit instance CSS
    conductor.__emit("Canvas.component-select-symphony:show", { elementId: "n1" });
    const tag1 = document.getElementById("component-instance-css-n1") as HTMLStyleElement | null;
    expect(tag1).toBeTruthy();
    const css1 = (tag1?.textContent || "").replace(/\s+/g, "");
    expect(css1).toContain(".rx-sync-1{position:absolute;left:10px;top:20px;");

    // Update store position and emit drag end
    store.actions.move("n1", { x: 15, y: 25 });
    conductor.__emit("Canvas.component-drag-symphony:end", { elementId: "n1" });
    const tag2 = document.getElementById("component-instance-css-n1") as HTMLStyleElement | null;
    const css2 = (tag2?.textContent || "").replace(/\s+/g, "");
    expect(css2).toContain(".rx-sync-1{position:absolute;left:15px;top:25px;");
  });
});

