import { registerSelectionConcertmaster } from "../../../../plugins/canvas-ui-plugin/features/selection/selection.concertmaster";
import { createCanvasPromptBook } from "../../../../plugins/canvas-ui-plugin/state/canvas.prompt-book";

describe("Selection Concertmaster Rehearsal", () => {
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

  it("sets selectedId on show and clears on hide", () => {
    const store = createCanvasPromptBook();
    const conductor = makeFakeConductor();
    registerSelectionConcertmaster(conductor, { store });

    conductor.__emit("Canvas.component-select-symphony:show", {
      elementId: "x",
    });
    expect(store.selectors.selectedId()).toBe("x");

    conductor.__emit("Canvas.component-select-symphony:hide", {});
    expect(store.selectors.selectedId()).toBeNull();
  });
});
