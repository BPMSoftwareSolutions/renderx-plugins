export function injectCssFallback(css: string) {
  if (!css) return;
  if (typeof document === "undefined") return;
  const id = "rx-components-styles";
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  const text = el.textContent || "";
  if (!text.includes(css)) {
    el.appendChild(document.createTextNode(css));
  }
}

export function injectRawCss(ctx: any, css: string) {
  if (!css) return;
  if (ctx?.stageCrew?.injectRawCSS) {
    try {
      ctx.stageCrew.injectRawCSS(css);
      return;
    } catch {}
  }
  injectCssFallback(css);
}

