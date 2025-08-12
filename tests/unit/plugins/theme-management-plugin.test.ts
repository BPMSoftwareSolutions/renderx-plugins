import { loadRenderXPlugin, createTestLogger } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/theme-management-plugin/index.js';

describe('RenderX Theme Management Plugin', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('exports sequence and handlers', () => {
    expect(plugin.sequence).toBeTruthy();
    expect(plugin.handlers).toBeTruthy();
    expect(typeof plugin.handlers.validateTheme).toBe('function');
    expect(typeof plugin.handlers.applyTheme).toBe('function');
    expect(typeof plugin.handlers.persistTheme).toBe('function');
    expect(typeof plugin.handlers.notifyThemeChange).toBe('function');
  });

  test('sequence registers in SequenceRegistry', async () => {
    const { SequenceRegistry } = await import('../../../../modules/communication/sequences/core/SequenceRegistry');
    const { EventBus } = await import('../../../../modules/communication/EventBus');
    const registry = new SequenceRegistry(new EventBus());
    expect(() => registry.register(plugin.sequence)).not.toThrow();
  });

  describe('handlers', () => {
    const base = (overrides: any = {}) => ({ payload: {}, logger: createTestLogger(), targetTheme: 'dark', sequence: plugin.sequence, ...overrides });

    test('validateTheme throws for invalid theme', () => {
      const ctx: any = base({ targetTheme: 'invalid' });
      expect(() => plugin.handlers.validateTheme({}, ctx)).toThrow('Invalid theme');
    });

    test('validateTheme returns validated payload for valid theme', () => {
      const ctx: any = base({ targetTheme: 'light' });
      const res = plugin.handlers.validateTheme({}, ctx);
      expect(res).toEqual({ validated: true, theme: 'light' });
    });

    test('applyTheme sets DOM attributes and class', () => {
      document.documentElement.setAttribute('data-theme', '');
      document.body.className = '';
      const ctx: any = base({ targetTheme: 'dark' });
      const res = plugin.handlers.applyTheme({}, ctx);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.body.className).toBe('theme-dark');
      expect(res).toEqual({ applied: true, theme: 'dark' });
    });

    test('persistTheme writes to localStorage when enabled', () => {
      const setItem = jest.spyOn(window.localStorage.__proto__, 'setItem');
      const ctx: any = base();
      ctx.payload.theme = 'dark';
      const res = plugin.handlers.persistTheme({}, ctx);
      expect(res.persisted).toBe(true);
      expect(setItem).toHaveBeenCalledWith('app-theme', 'dark');
      setItem.mockRestore();
    });

    test('notifyThemeChange invokes callback', () => {
      const onThemeChange = jest.fn();
      const ctx: any = base({ onThemeChange });
      ctx.payload.theme = 'light';
      const res = plugin.handlers.notifyThemeChange({}, ctx);
      expect(onThemeChange).toHaveBeenCalledWith('light');
      expect(res).toEqual({ notified: true, theme: 'light' });
    });
  });
});

