// Instance Concertmaster: keeps actual component instance CSS in sync with store position on selection and drag end
import type { CanvasPromptBook } from "../../state/canvas.prompt-book";
import { makeInstanceStageCrew } from "./instance.stage-crew";

export function registerInstanceConcertmaster(
  conductor: any,
  deps: { store: CanvasPromptBook; instanceCrew?: ReturnType<typeof makeInstanceStageCrew> }
) {
  const { store } = deps;
  const crew = deps.instanceCrew || makeInstanceStageCrew();

  // On selection show: ensure instance CSS reconciles to store position
  conductor.on("Canvas.component-select-symphony", "show", ({ elementId }: any) => {
    try {
      const n = store.selectors.nodeById(elementId);
      const cls = String(n?.cssClass || n?.id || elementId || "").trim();
      const pos = store.selectors.positionOf(elementId);
      crew.commitPosition(elementId, cls, pos);
    } catch {}
  });

  // On drag end: commit instance to store final position
  conductor.on("Canvas.component-drag-symphony", "end", ({ elementId }: any) => {
    try {
      const n = store.selectors.nodeById(elementId);
      const cls = String(n?.cssClass || n?.id || elementId || "").trim();
      const pos = store.selectors.positionOf(elementId);
      crew.commitPosition(elementId, cls, pos);
    } catch {}
  });
}

