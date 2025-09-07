import { injectRawCss } from "../create/create.css.stage-crew";

export function injectCssClasses(_data: any, ctx: any) {
  try {
    const cssMap = ctx.payload.importCssClasses || {};
    for (const key of Object.keys(cssMap)) {
      const def = cssMap[key];
      const css = def?.content;
      if (typeof css === "string" && css.trim().length) {
        injectRawCss(ctx, css);
      }
    }
  } catch (e) {
    ctx.logger?.warn?.("injectCssClasses failed:", e);
  }
}

