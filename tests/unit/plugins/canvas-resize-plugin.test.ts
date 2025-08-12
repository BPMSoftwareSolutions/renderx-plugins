import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/canvas-resize-plugin/index.js';

describe('RenderX Canvas Resize Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.handleResizeStart).toBe('function');
    expect(typeof plugin.handlers.handleResizeMove).toBe('function');
    expect(typeof plugin.handlers.handleResizeEnd).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const base = () => ({ payload: {}, logger: createTestLogger() });

    test('handleResizeStart seeds payload', () => {
      const ctx: any = base();
      const res = plugin.handlers.handleResizeStart({ elementId: 'a', handle: 'se', start: { x: 1, y: 2 }, tools: { resize: { constraints: { min: { w: 10, h: 10 } } } }, startBox: { x: 0, y: 0, w: 100, h: 50 } }, ctx);
      expect(res.resize).toBeTruthy();
      expect(res.resize.startBox).toEqual({ x: 0, y: 0, w: 100, h: 50 });
      expect(res.resize.constraints).toEqual({ min: { w: 10, h: 10 } });
    });

    test('handleResizeMove applies deltas and constraints for SE handle', () => {
      const ctx: any = base();
      ctx.payload.resize = { startBox: { x: 0, y: 0, w: 100, h: 50 }, constraints: { min: { w: 30, h: 20 } } };
      const res = plugin.handlers.handleResizeMove({ elementId: 'a', handle: 'se', delta: { dx: 10, dy: 5 }, onResizeUpdate: jest.fn() }, ctx);
      expect(res.box.w).toBeGreaterThanOrEqual(30);
      expect(res.box.h).toBeGreaterThanOrEqual(20);
      expect(res.box).toEqual(expect.objectContaining({ w: 110, h: 55 }));
    });

    test('handleResizeMove for W handle adjusts x and width', () => {
      const ctx: any = base();
      ctx.payload.resize = { startBox: { x: 10, y: 10, w: 100, h: 50 } };
      const res = plugin.handlers.handleResizeMove({ elementId: 'a', handle: 'w', delta: { dx: -20, dy: 0 }, onResizeUpdate: jest.fn() }, ctx);
      expect(res.box.x).toBe( -10 );
      expect(res.box.w).toBe(120);
    });

    test('handleResizeEnd calls onResizeEnd if provided', () => {
      const onResizeEnd = jest.fn();
      const ctx: any = base();
      const res = plugin.handlers.handleResizeEnd({ onResizeEnd }, ctx);
      expect(onResizeEnd).toHaveBeenCalled();
      expect(res).toEqual({});
    });
  });
});

