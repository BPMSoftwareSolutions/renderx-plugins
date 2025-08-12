// Shared setup to make CIA plugin registration work in unit tests
// - Stubs fetch(/plugins/manifest.json) to serve the repo manifest
// - Stubs PluginLoader.loadPluginModule to import RenderX/public plugin modules

import { PluginLoader } from "@communication/sequences/plugins/PluginLoader";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

function mapWebPathToLocalFile(webPath: string): string {
  const rel = webPath.replace(/^\/?plugins\//, "RenderX/public/plugins/");
  return path.resolve(process.cwd(), rel);
}

beforeAll(() => {
  // Stub fetch to serve manifest from local repo
  // @ts-ignore
  global.fetch = async (url: string) => {
    if (typeof url === "string" && url.endsWith("/plugins/manifest.json")) {
      const local = mapWebPathToLocalFile("/plugins/manifest.json");
      const jsonText = fs.readFileSync(local, "utf-8");
      return {
        ok: true,
        async json() {
          return JSON.parse(jsonText);
        },
        status: 200,
        statusText: "OK",
      } as any;
    }
    throw new Error(`Unhandled fetch URL in test setup: ${url}`);
  };

  // Spy on PluginLoader to import plugin modules from local files
  jest
    .spyOn(PluginLoader.prototype as any, "loadPluginModule")
    .mockImplementation(async (...args: any[]) => {
      const webPath = String(args[0]);
      const localFile = mapWebPathToLocalFile(webPath);
      const fileUrl = pathToFileURL(localFile).href;
      return await import(fileUrl);
    });
});

afterAll(() => {
  jest.restoreAllMocks();
  // @ts-ignore
  delete global.fetch;
});
