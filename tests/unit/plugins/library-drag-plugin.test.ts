import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/library-drag-plugin/index.js';

describe('RenderX Library Drag Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.startDrag).toBe('function');
    expect(typeof plugin.handlers.endDrag).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const ctx = () => ({ payload: {}, logger: createTestLogger() });

    test('startDrag returns dragToken and component metadata', () => {
      const component = { metadata: { name: 'Button', type: 'basic' } };
      const res = plugin.handlers.startDrag({ component }, ctx());
      expect(res.dragToken).toBeTruthy();
      expect(res.componentMeta).toEqual(component.metadata);
    });

    test('endDrag returns ended true and logs', () => {
      const c = ctx();
      const res = plugin.handlers.endDrag({}, c);
      expect(res.ended).toBe(true);
      expect(c.logger.info).toHaveBeenCalled();
    });
  });
});

