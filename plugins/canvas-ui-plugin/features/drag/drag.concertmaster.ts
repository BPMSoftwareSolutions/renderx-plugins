// Drag Concertmaster (Controller): orchestrates drag symphony
import type { dragArrangement as DragArrangement } from './drag.arrangement';

export function registerDragConcertmaster(
  conductor: any,
  deps: { store: any; dragArrangement: typeof DragArrangement }
) {
  const { store, dragArrangement } = deps;

  conductor.on('Canvas.component-drag-symphony', 'start', ({ elementId }: any) => {
    store.actions.select(elementId);
    conductor.play('Overlay', 'hide-handles', { elementId });
  });

  conductor.on('Canvas.component-drag-symphony', 'update', ({ elementId, delta }: any) => {
    const current = store.selectors.positionOf(elementId);
    const next = dragArrangement.applyDelta(current, delta);
    store.actions.move(elementId, next);
    conductor.play('Overlay', 'transform', { elementId, dx: delta?.dx ?? 0, dy: delta?.dy ?? 0 });
  });

  conductor.on('Canvas.component-drag-symphony', 'end', ({ elementId }: any) => {
    const pos = store.selectors.positionOf(elementId);
    conductor.play('Overlay', 'commit-position', { elementId, position: pos });
    conductor.play('Overlay', 'show-handles', { elementId });
  });
}

