// Overlay StageCrew (Adapter): applies arrangement CSS via a cssAdapter port
export function makeOverlayStageCrew(cssAdapter: { upsertStyle: Function; removeStyle: Function }, overlayArrangement: any) {
  return {
    transform(elementId: string, dx: number, dy: number) {
      const css = overlayArrangement.transformRule(elementId, dx, dy);
      cssAdapter.upsertStyle(`overlay-transform-${elementId}`, css);
    },
    hide(elementId: string) {
      const css = overlayArrangement.hideRule(elementId);
      cssAdapter.upsertStyle(`overlay-visibility-${elementId}`, css);
    },
    show(elementId: string) {
      cssAdapter.removeStyle(`overlay-visibility-${elementId}`);
    },
    commitInstance(elementId: string, position: { x: number; y: number }, size: { w?: number|string; h?: number|string }) {
      const css = overlayArrangement.instanceRule(elementId, position, size);
      cssAdapter.upsertStyle(`overlay-instance-${elementId}`, css);
    },
  };
}

