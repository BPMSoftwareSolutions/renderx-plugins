import { ensureCursorStylesInjected } from "../styles/cursors.js";
import { attachDragHandlers } from "../handlers/drag.js";
import { updateInstancePositionCSS } from "../styles/instanceCss.js";
import { injectRawCSS, injectInstanceCSS } from "../utils/styles.js";
import {
  parseTemplateShape,
  resolveTemplateTokens,
} from "../utils/template.js";

export function renderCanvasNode(node) {
  const React = (typeof window !== "undefined" && window.React) || null;
  if (!React || !node) return null;

  ensureCursorStylesInjected();

  const component = node.component || node.componentData || {};
  const template = (component.ui && component.ui.template) || "<div></div>";
  const data = node.data || {};

  const resolvedHtml = resolveTemplateTokens(template, data);
  const { tag, classes: tplClasses } = parseTemplateShape(resolvedHtml);

  try {
    const css = component?.ui?.styles?.css;
    if (css) injectRawCSS(css);
    const defaults = component?.integration?.canvasIntegration || {};
    injectInstanceCSS(node, defaults.defaultWidth, defaults.defaultHeight);
  } catch {}

  const classes = [String(node.cssClass || node.id || ""), ...tplClasses]
    .filter(Boolean)
    .join(" ");

  const dragHandlers = attachDragHandlers(node, { updateInstancePositionCSS });

  return React.createElement(
    tag,
    {
      id: node.id,
      className: classes,
      "data-component-id": node.id,
      onPointerDown: dragHandlers.onPointerDown,
      onPointerMove: dragHandlers.onPointerMove,
      onPointerUp: dragHandlers.onPointerUp,
    },
    React.createElement("div", {
      dangerouslySetInnerHTML: { __html: resolvedHtml },
    })
  );
}
