// Minimal shim for PluginLoader used in jest.cia-plugins.setup.ts
export class PluginLoader {
  async loadPluginModule(_path: string): Promise<any> {
    throw new Error("PluginLoader shim not implemented");
  }
}

