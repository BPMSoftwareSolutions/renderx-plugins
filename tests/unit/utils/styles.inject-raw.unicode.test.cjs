const { injectRawCSS } = require("../../../plugins/canvas-ui-plugin/utils/styles.js");

describe("injectRawCSS handles non-ASCII CSS safely", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  test("injects CSS containing unicode and quotes (btoa would throw)", () => {
    const css = "body{font-family:'Inter',sans-serif}.btn:after{content:'»';}";

    // Sanity: ensure no style tags to start
    expect(document.head.querySelectorAll("style").length).toBe(0);

    injectRawCSS(css);

    const styles = Array.from(document.head.querySelectorAll("style"));
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain("font-family");
    expect(styles[0].textContent).toContain("content:'»'");

    // Calling again should no-op (same id)
    injectRawCSS(css);
    expect(document.head.querySelectorAll("style").length).toBe(1);
  });
});

