// Selection Concertmaster (Controller): orchestrates selection updates via Prompt Book
export function registerSelectionConcertmaster(
  conductor: any,
  deps: { store: any }
) {
  const { store } = deps;

  // Show selection -> set selectedId
  conductor.on(
    'Canvas.component-select-symphony',
    'show',
    ({ elementId }: any) => {
      store.actions.select(elementId ?? null);
    }
  );

  // Hide/clear selection -> set selectedId to null
  conductor.on(
    'Canvas.component-select-symphony',
    'hide',
    (_payload: any) => {
      store.actions.select(null);
    }
  );
}

