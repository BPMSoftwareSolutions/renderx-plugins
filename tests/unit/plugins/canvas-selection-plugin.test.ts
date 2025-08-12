import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/canvas-selection-plugin/index.js';

describe('RenderX Canvas Selection Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.handleSelect).toBe('function');
    expect(typeof plugin.handlers.handleFinalize).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const base = () => ({ payload: {}, logger: createTestLogger() });

    test('handleSelect calls callback and returns selected', () => {
      const onSelectionChange = jest.fn();
      const ctx: any = base();
      const res = plugin.handlers.handleSelect({ elementId: 'id1', onSelectionChange }, ctx);
      expect(onSelectionChange).toHaveBeenCalledWith('id1');
      expect(res).toEqual({ elementId: 'id1', selected: true });
    });

    test('handleFinalize clears selection when flag is true', () => {
      const onSelectionChange = jest.fn();
      const ctx: any = base();
      const res = plugin.handlers.handleFinalize({ elementId: 'id1', clearSelection: true, onSelectionChange }, ctx);
      expect(onSelectionChange).toHaveBeenCalledWith(null);
      expect(res).toEqual({ elementId: 'id1', cleared: true });
    });
  });
});

