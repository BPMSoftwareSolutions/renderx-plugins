import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/canvas-create-plugin/index.js';

describe('RenderX Canvas Create Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.createCanvasComponent).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const ctx = () => ({ payload: {}, logger: createTestLogger() });

    test('createCanvasComponent returns created payload with id/cssClass/type/position and invokes callback', () => {
      const onComponentCreated = jest.fn();
      const component = { metadata: { type: 'Widget' } };
      const position = { x: 10, y: 20 };
      const c: any = ctx();
      const res = plugin.handlers.createCanvasComponent({ component, position, onComponentCreated }, c);
      expect(res.created).toBe(true);
      expect(res.id).toBeTruthy();
      expect(res.cssClass).toBe(res.id);
      expect(res.type).toBe('widget');
      expect(res.position).toEqual(position);
      expect(onComponentCreated).toHaveBeenCalledWith(expect.objectContaining({ id: res.id, cssClass: res.cssClass }));
    });
  });
});

