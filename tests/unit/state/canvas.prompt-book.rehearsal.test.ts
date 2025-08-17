import { createCanvasPromptBook } from '../../../plugins/canvas-ui-plugin/state/canvas.prompt-book';

describe('Canvas Prompt Book Rehearsal', () => {
  it('initializes with nodes and selectedId and exposes selectors', () => {
    const pb = createCanvasPromptBook({ nodes: [{ id: 'a', position: { x: 1, y: 2 } }], selectedId: 'a' });
    expect(pb.selectors.nodes()).toHaveLength(1);
    expect(pb.selectors.selectedId()).toBe('a');
    expect(pb.selectors.positionOf('a')).toEqual({ x: 1, y: 2 });
    expect(pb.selectors.nodeById('a')?.id).toBe('a');
  });

  it('actions.select updates selectedId', () => {
    const pb = createCanvasPromptBook();
    pb.actions.select('x');
    expect(pb.selectors.selectedId()).toBe('x');
    pb.actions.select(null as any);
    expect(pb.selectors.selectedId()).toBeNull();
  });

  it('actions.setNodes and actions.move update node positions immutably', () => {
    const pb = createCanvasPromptBook({ nodes: [{ id: 'a', position: { x: 0, y: 0 } }, { elementId: 'b' }] });
    pb.actions.move('a', { x: 5, y: 6 });
    expect(pb.selectors.positionOf('a')).toEqual({ x: 5, y: 6 });

    pb.actions.setNodes([{ id: 'a', position: { x: 10, y: 10 } }]);
    expect(pb.selectors.nodes()).toHaveLength(1);
    expect(pb.selectors.positionOf('a')).toEqual({ x: 10, y: 10 });
  });

  it('subscribe notifies on changes and allows unsubscribe', () => {
    const pb = createCanvasPromptBook();
    const calls: number[] = [];
    const unsub = pb.subscribe(() => calls.push(Date.now()));
    pb.actions.select('a');
    pb.actions.setNodes([{ id: 'a' } as any]);
    pb.actions.move('a', { x: 1, y: 2 });
    unsub();
    pb.actions.select(null);
    const notified = calls.length;
    pb.actions.select('b');
    expect(calls.length).toBe(notified);
  });
});

