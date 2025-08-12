import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/canvas-drag-plugin/index.js';

describe('RenderX Canvas Drag Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.handleDragStart).toBe('function');
    expect(typeof plugin.handlers.handleDragMove).toBe('function');
    expect(typeof plugin.handlers.handleDragEnd).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const base = () => ({ payload: {}, logger: createTestLogger() });

    test('handleDragStart persists origin', () => {
      const origin = { x: 100, y: 50 };
      const ctx: any = base();
      const res = plugin.handlers.handleDragStart({ elementId: 'id1', origin }, ctx);
      expect(res.drag.origin).toEqual(origin);
    });

    test('handleDragMove computes position and invokes onDragUpdate', () => {
      const origin = { x: 10, y: 20 };
      const delta = { dx: 5, dy: -3 };
      const onDragUpdate = jest.fn();
      const ctx: any = base();
      ctx.payload.drag = { origin };
      const res = plugin.handlers.handleDragMove({ elementId: 'id1', delta, onDragUpdate }, ctx);
      expect(res.position).toEqual({ x: 15, y: 17 });
      expect(onDragUpdate).toHaveBeenCalledWith({ elementId: 'id1', position: { x: 15, y: 17 } });
    });

    test('handleDragEnd calls onDragEnd if provided', () => {
      const onDragEnd = jest.fn();
      const ctx: any = base();
      const res = plugin.handlers.handleDragEnd({ onDragEnd }, ctx);
      expect(onDragEnd).toHaveBeenCalled();
      expect(res).toEqual({});
    });
  });
});

