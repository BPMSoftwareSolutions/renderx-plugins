// Overlay Concertmaster: listens to drag/selection cues and coordinates StageCrew
import { overlayArrangement } from './overlay.arrangement';
import { makeOverlayStageCrew } from './overlay.stage-crew';

export function registerOverlayConcertmaster(
  conductor: any,
  deps: {
    store: any,
    cssAdapter: { upsertStyle: Function; removeStyle: Function };
  }
) {
  const { store, cssAdapter } = deps;
  const crew = makeOverlayStageCrew(cssAdapter, overlayArrangement);

  // On drag start: hide handles
  conductor.on('Canvas.component-drag-symphony', 'start', ({ elementId }: any) => {
    crew.hide(elementId);
  });

  // On drag update: transform overlay (do not commit)
  conductor.on(
    'Canvas.component-drag-symphony',
    'update',
    ({ elementId, delta }: any) => {
      const dx = delta?.dx ?? 0;
      const dy = delta?.dy ?? 0;
      crew.transform(elementId, dx, dy);
    }
  );

  // On drag end: commit instance CSS to final position from Prompt Book and show handles
  conductor.on('Canvas.component-drag-symphony', 'end', ({ elementId }: any) => {
    const pos = store.selectors.positionOf(elementId);
    crew.commitInstance(elementId, pos, {});
    crew.show(elementId);
  });

  // On selection change: ensure overlay instance CSS exists and visible
  conductor.on('Canvas.component-select-symphony', 'show', ({ elementId }: any) => {
    const pos = store.selectors.positionOf(elementId);
    crew.commitInstance(elementId, pos, {});
    crew.show(elementId);
  });

  conductor.on('Canvas.component-select-symphony', 'hide', (_: any) => {
    // No-op for now; could hide overlay entirely if desired
  });
}

