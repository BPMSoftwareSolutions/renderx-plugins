import { loadRenderXPlugin } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/control-panel-plugin/index.js';

describe('RenderX Control Panel Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.noop).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('UI export', () => {
    test('ControlPanelPanel is exported as a function', () => {
      expect(typeof plugin.ControlPanelPanel).toBe('function');
    });

    test('ControlPanelPanel returns null when window.React is not available', () => {
      const original = (global as any).window?.React;
      try {
        (global as any).window.React = undefined;
        const result = plugin.ControlPanelPanel({});
        expect(result).toBeNull();
      } finally {
        (global as any).window.React = original;
      }
    });
  });
});

