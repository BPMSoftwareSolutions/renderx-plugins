import { registerCanvasConcertmasters } from "../../../plugins/canvas-ui-plugin/bootstrap/concertmasters.bootstrap";
import { createCanvasPromptBook } from "../../../plugins/canvas-ui-plugin/state/canvas.prompt-book";

function makeFakeConductor() {
  const subs = new Map<string, Set<Function>>();
  function emit(name: string, payload: any) {
    const set = subs.get(name);
    if (set)
      set.forEach((fn) => {
        try {
          (fn as any)(payload);
        } catch {}
      });
  }
  const cx = {
    play: jest.fn(),
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
    off: (chan: string, act: string, cb: any) => {
      const name = `${chan}:${act}`;
      const s = subs.get(name);
      s?.delete(cb);
    },
    __emit: emit,
  } as any;
  return cx;
}

describe("Concertmasters Bootstrap Rehearsal", () => {
  it("wires drag concertmaster: start, update, end update Prompt Book and play overlay", () => {
    const conductor = makeFakeConductor();
    const store = createCanvasPromptBook({
      nodes: [{ id: "a", position: { x: 0, y: 0 } }],
    });
    registerCanvasConcertmasters(conductor, { store });

    // start selects and hides handles
    conductor.__emit("Canvas.component-drag-symphony:start", {
      elementId: "a",
    });
    expect(store.selectors.selectedId()).toBe("a");
    expect(conductor.play).toHaveBeenCalledWith("Overlay", "hide-handles", {
      elementId: "a",
    });

    // update moves and transforms overlay
    conductor.__emit("Canvas.component-drag-symphony:update", {
      elementId: "a",
      delta: { dx: 3, dy: -2 },
    });
    expect(store.selectors.positionOf("a")).toEqual({ x: 3, y: -2 });
    expect(conductor.play).toHaveBeenCalledWith("Overlay", "transform", {
      elementId: "a",
      dx: 3,
      dy: -2,
    });

    // end commits position and shows handles
    conductor.__emit("Canvas.component-drag-symphony:end", { elementId: "a" });
    expect(conductor.play).toHaveBeenCalledWith("Overlay", "commit-position", {
      elementId: "a",
      position: { x: 3, y: -2 },
    });
    expect(conductor.play).toHaveBeenCalledWith("Overlay", "show-handles", {
      elementId: "a",
    });
  });
});
