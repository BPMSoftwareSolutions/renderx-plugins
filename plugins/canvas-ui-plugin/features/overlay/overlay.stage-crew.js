// Overlay StageCrew (Adapter): applies arrangement CSS via a cssAdapter port
export function makeOverlayStageCrew(cssAdapter, overlayArrangement) {
  return {
    transform(elementId, dx, dy) {
      const css = overlayArrangement.transformRule(elementId, dx, dy);
      cssAdapter.upsertStyle(`overlay-transform-${elementId}`, css);
    },
    hide(elementId) {
      const css = overlayArrangement.hideRule(elementId);
      cssAdapter.upsertStyle(`overlay-visibility-${elementId}`, css);
    },
    show(elementId) {
      cssAdapter.removeStyle(`overlay-visibility-${elementId}`);
    },
    commitInstance(elementId, position, size) {
      const css = overlayArrangement.instanceRule(elementId, position, size);
      cssAdapter.upsertStyle(`overlay-instance-${elementId}`, css);
    },
  };
}

