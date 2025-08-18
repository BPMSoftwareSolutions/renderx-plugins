// Drag Rehearsal: arrangement math and concertmaster orchestration
import { dragArrangement } from '../../../../plugins/canvas-ui-plugin/features/drag/drag.arrangement';
import { registerDragConcertmaster } from '../../../../plugins/canvas-ui-plugin/features/drag/drag.concertmaster';

describe('Drag Rehearsal', () => {
  it('arrangement.applyDelta moves by dx/dy', () => {
    expect(dragArrangement.applyDelta({ x: 10, y: 5 }, { dx: 3, dy: -2 })).toEqual({ x: 13, y: 3 });
    expect(dragArrangement.applyDelta({ x: 0, y: 0 }, { dx: -1, dy: 2 })).toEqual({ x: -1, y: 2 });
  });

  it('concertmaster reacts to start/update/end with expected plays and store updates', () => {
    const plays: any[] = [];
    const onHandlers: Record<string, Function> = {};
    const conductor = {
      on: (channel: string, action: string, cb: Function) => {
        onHandlers[`${channel}:${action}`] = cb;
      },
      play: (channel: string, action: string, payload: any) => {
        plays.push({ channel, action, payload });
      },
    } as any;

    const store = {
      selectors: { positionOf: (_id: string) => ({ x: 10, y: 5 }) },
      actions: { select: jest.fn(), move: jest.fn() },
    };

    registerDragConcertmaster(conductor, { store, dragArrangement });

    onHandlers['Canvas.component-drag-symphony:start']({ elementId: 'A' });
    expect(store.actions.select).toHaveBeenCalledWith('A');
    expect(plays).toContainEqual({ channel: 'Overlay', action: 'hide-handles', payload: { elementId: 'A' } });

    onHandlers['Canvas.component-drag-symphony:update']({ elementId: 'A', delta: { dx: 3, dy: 7 } });
    expect(store.actions.move).toHaveBeenCalledWith('A', { x: 13, y: 12 });
    expect(plays).toContainEqual({ channel: 'Overlay', action: 'transform', payload: { elementId: 'A', dx: 3, dy: 7 } });

    onHandlers['Canvas.component-drag-symphony:end']({ elementId: 'A' });
    expect(plays).toContainEqual({ channel: 'Overlay', action: 'commit-position', payload: { elementId: 'A', position: { x: 10, y: 5 } } });
    expect(plays).toContainEqual({ channel: 'Overlay', action: 'show-handles', payload: { elementId: 'A' } });
  });
});

