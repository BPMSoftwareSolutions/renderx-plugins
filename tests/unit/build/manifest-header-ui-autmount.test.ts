import fs from "fs";
import path from "path";

describe("Manifest: header UI plugins must not autoMount (UI-only)", () => {
  test("plugins/manifest.json header entries have autoMount=false (or absent)", () => {
    const p = path.resolve(__dirname, "../../../plugins/manifest.json");
    const json = JSON.parse(fs.readFileSync(p, "utf8"));
    const headers = (json.plugins || []).filter((pl: any) =>
      /^header\/(left|center|right)\/$/.test(pl.path || "")
    );
    expect(headers.length).toBe(3);
    for (const h of headers) {
      // Should not be true; UI-only should not be auto-mounted as CIA plugins
      expect(h.autoMount === true).toBe(false);
    }
  });
});

