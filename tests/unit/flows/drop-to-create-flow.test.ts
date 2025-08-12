import { loadRenderXPlugin } from '../../../utils/renderx-plugin-loader';

const libraryPath = 'RenderX/public/plugins/library-drop-plugin/index.js';
const createPath = 'RenderX/public/plugins/canvas-create-plugin/index.js';

describe('Integration Flow: Library.component-drop-symphony -> Canvas.component-create-symphony', () => {
  test('matches legacy flow: start -> forward -> create -> complete; onComponentCreated invoked with rx-comp-* id/class', async () => {
    const lib: any = loadRenderXPlugin(libraryPath);
    const create: any = loadRenderXPlugin(createPath);

    // Logger spies to record message order
    const logs: string[] = [];
    const logger = {
      info: (...args: any[]) => { try { logs.push(String(args[0])); } catch {} },
      warn: (..._args: any[]) => void 0,
      error: (..._args: any[]) => void 0,
    };

    const onComponentCreated = jest.fn();

    // Conductor stub: when asked to play the canvas create symphony, call its handler
    const conductor = {
      play: async (pluginOrId: string, sequenceId: string, data: any) => {
        if (sequenceId === create.sequence.id) {
          // Build a minimal context for create handler
          const ctx = { ...data, logger } as any;
          return create.handlers.createCanvasComponent(data, ctx);
        }
        throw new Error(`Unexpected sequenceId: ${sequenceId}`);
      }
    };

    // Build a minimal executor for the library sequence beats (in order)
    const executeLibraryDrop = async (payload: any) => {
      const ctx: any = { ...payload, payload, conductor, logger };
      for (const movement of lib.sequence.movements) {
        for (const beat of movement.beats) {
          const handlerName = beat.handler;
          const handler = (lib.handlers as any)[handlerName];
          if (typeof handler !== 'function') throw new Error(`Missing handler: ${handlerName}`);
          // Provide latest context each beat; allow handler to update ctx.payload
          const result = await handler(payload, ctx);
          if (result !== undefined) ctx.payload = { ...ctx.payload, ...result };
        }
      }
      return ctx;
    };

    // Simulate a drop payload
    const coordinates = { x: 200, y: 120 };
    const component = { metadata: { name: 'Button', type: 'button' } };
    const dragData = { component };

    const finalCtx = await executeLibraryDrop({ coordinates, dragData, onComponentCreated });

    // Verify logger order (messages)
    expect(logs[0]).toContain('Library.drop:start');
    expect(logs.find(m => m.includes('Forwarding to Canvas.component-create-symphony'))).toBeTruthy();
    expect(logs.find(m => m.includes('Canvas.create'))).toBeTruthy();
    expect(logs.filter(m => m.includes('Library.drop:complete')).length).toBe(1);

    // Verify onComponentCreated invoked with expected shape
    expect(onComponentCreated).toHaveBeenCalledTimes(1);
    const createdArg = onComponentCreated.mock.calls[0][0];
    expect(createdArg.type).toBe('button');
    expect(createdArg.position).toEqual(coordinates);
    expect(String(createdArg.id)).toMatch(/^rx-comp-button-/);
    expect(String(createdArg.cssClass)).toMatch(/^rx-comp-button-/);
  });
});

