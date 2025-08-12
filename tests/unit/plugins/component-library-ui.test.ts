import { loadRenderXPlugin } from '../../../utils/renderx-plugin-loader';

const pluginPath = 'RenderX/public/plugins/component-library-plugin/index.js';

describe('RenderX Component Library Plugin - UI export', () => {
  let plugin: any;

  beforeAll(() => {
    plugin = loadRenderXPlugin(pluginPath);
  });

  test('LibraryPanel is exported as a function', () => {
    expect(typeof plugin.LibraryPanel).toBe('function');
  });

  test('LibraryPanel returns null when window.React is not available', () => {
    const original = (global as any).window?.React;
    try {
      (global as any).window.React = undefined;
      const result = plugin.LibraryPanel({});
      expect(result).toBeNull();
    } finally {
      (global as any).window.React = original;
    }
  });
});

