import { ensureCursorStylesInjected } from "../styles/cursors.js";
import { attachDragHandlers } from "../handlers/drag.js";
import { onElementClick } from "../handlers/select.js";
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
  // Provide sensible defaults for common tokens used in templates
  const defaults = {
    variant:
      node?.variant ??
      component?.ui?.defaults?.variant ??
      component?.variant ??
      "primary",
    size:
      node?.size ?? component?.ui?.defaults?.size ?? component?.size ?? "md",
    content:
      node?.content ?? component?.metadata?.name ?? component?.name ?? "",
  };
  const data = {
    ...(node || {}),
    ...(node?.component?.metadata || {}),
    ...(node?.component?.ui || {}),
    ...(node?.component || {}),
    ...(node?.data || {}),
    ...defaults,
  };

  const resolvedHtml = resolveTemplateTokens(template, data);
  const { tag, classes: tplClasses } = parseTemplateShape(resolvedHtml);
  // If template does not specify a semantic tag, use type or 'div'
  const semanticTag = tag || node.type || "div";
  // Try to extract inner text content from the resolved template
  let innerText = "";
  try {
    const m = resolvedHtml.match(/>\s*([^<]+)\s*</);
    innerText = m ? m[1] : "";
  } catch {}

  try {
    const css = component?.ui?.styles?.css;
    if (css) injectRawCSS(css);
    const defaults = component?.integration?.canvasIntegration || {};
    injectInstanceCSS(node, defaults.defaultWidth, defaults.defaultHeight);
  } catch {}

  let classes = [String(node.cssClass || node.id || ""), ...tplClasses]
    .filter(Boolean)
    .join(" ");

  // If resolvedHtml contains a class attribute with tokens resolved, ensure they're included in classes as well
  try {
    const m = resolvedHtml.match(/class\s*=\s*"([^"]*)"/i);
    if (m) {
      const fromAttr = m[1].split(/\s+/).filter(Boolean);
      const merged = new Set(
        (classes + " " + fromAttr.join(" ")).trim().split(/\s+/)
      );
      classes = Array.from(merged).join(" ");
    }
  } catch {}

  const dragHandlers = attachDragHandlers(node, { updateInstancePositionCSS });

  return React.createElement(
    semanticTag,
    {
      id: node.id,
      className: classes,
      "data-component-id": node.id,
      onPointerEnter: dragHandlers.onPointerEnter,
      onPointerLeave: dragHandlers.onPointerLeave,
      onPointerDown: dragHandlers.onPointerDown,
      onPointerMove: dragHandlers.onPointerMove,
      onPointerUp: dragHandlers.onPointerUp,
      onClick: onElementClick(node),
    },
    innerText
  );
}
