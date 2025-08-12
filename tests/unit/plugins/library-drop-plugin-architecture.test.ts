import { loadRenderXPlugin } from '../../../utils/renderx-plugin-loader';

const libraryPath = 'RenderX/public/plugins/library-drop-plugin/index.js';

describe('Library Drop Plugin - architecture', () => {
  test('forwardToCanvasCreate uses conductor.play (no direct emit)', async () => {
    const lib: any = loadRenderXPlugin(libraryPath);

    const emitted: Array<any> = [];
    const emittedFn = jest.fn((event: string, payload: any) => emitted.push({ event, payload }));

    const called: Array<any> = [];
    const conductor = {
      play: jest.fn((_p: string, sequenceId: string, data: any) => {
        called.push({ sequenceId, data });
        return Promise.resolve({ ok: true });
      }),
    } as any;

    const ctx: any = {
      payload: { coordinates: { x: 10, y: 20 }, component: { metadata: { type: 'button' } } },
      emit: emittedFn,
      conductor,
      logger: { info: () => {}, warn: () => {}, error: () => {} },
    };

    await lib.handlers.forwardToCanvasCreate({ onComponentCreated: () => {} }, ctx);

    expect(conductor.play).toHaveBeenCalledWith(
      'Canvas.component-create-symphony',
      'Canvas.component-create-symphony',
      expect.objectContaining({ position: { x: 10, y: 20 } })
    );

    // Ensure no direct emit path was taken
    expect(emittedFn).not.toHaveBeenCalled();
  });
});

