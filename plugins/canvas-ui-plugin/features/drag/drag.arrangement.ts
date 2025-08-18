// Drag Arrangement (Service): pure position math
export const dragArrangement = {
  applyDelta(current: { x?: number; y?: number } = {}, delta: { dx?: number; dy?: number } = {}) {
    const x0 = typeof current.x === 'number' ? current.x : 0;
    const y0 = typeof current.y === 'number' ? current.y : 0;
    const dx = typeof delta.dx === 'number' ? delta.dx : 0;
    const dy = typeof delta.dy === 'number' ? delta.dy : 0;
    return { x: x0 + dx, y: y0 + dy };
  },
};

