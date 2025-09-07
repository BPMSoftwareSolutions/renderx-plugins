import { injectRawCss } from "./create.css.stage-crew";
import {
  getCanvasOrThrow,
  createElementWithId,
  applyClasses,
  applyInlineStyle,
  appendTo,
} from "./create.dom.stage-crew";
import {
  computeInstanceClass,
  computeCssVarBlock,
  computeInlineStyle,
} from "./create.style.stage-crew";
import {
  attachSelection,
  attachDrag,
  attachSvgNodeClick,
} from "./create.interactions.stage-crew";
import { ComponentRuleEngine } from "../../../../src/component-mapper/rule-engine";

const _ruleEngine = new ComponentRuleEngine();

// Helper function to apply content properties to DOM elements
function applyContentProperties(
  element: HTMLElement,
  content: Record<string, any>,
  type: string
) {
  // Apply via rule engine (JSON-driven)
  _ruleEngine.applyContent(element, type, content);
}

export const createNode = (data: any, ctx: any) => {
  const tpl = ctx.payload.template;
  const id = ctx.payload.nodeId;

  // 1) Create node via direct DOM and append to canvas or container
  const canvas = getCanvasOrThrow();
  const el = createElementWithId(tpl.tag, id);

  // 2) Inject component CSS (if provided by JSON schema)
  if (tpl.css) {
    injectRawCss(ctx, tpl.css);
    // queue for UI-side injection if needed
    (ctx.payload._cssQueue ||= []).push(tpl.css);
  }

  // 3) Build a unique, dedicated instance class for this node
  const instanceClass = computeInstanceClass(tpl.tag, id);

  // 4) Apply variables via CSS custom properties on the instance class
  const cssVars: Record<string, string> = tpl.cssVariables || {};
  const varBlock = computeCssVarBlock(cssVars);
  if (varBlock) {
    injectRawCss(ctx, `.${instanceClass} ${varBlock}`);
  }

  // 5) Build inline style: position + initial size
  const style = computeInlineStyle(data, tpl);

  // 6) Apply classes and inline style (position + size) and text
  const classList = Array.from(
    new Set([...(tpl.classes || []), instanceClass])
  );
  applyClasses(el, classList);
  applyInlineStyle(el, style);
  if (typeof tpl.text === "string" && tpl.text.length)
    el.textContent = String(tpl.text);

  // 6.5) Apply arbitrary attributes from the template (data-* for tools, roles, etc.)
  if (tpl?.attributes && typeof tpl.attributes === "object") {
    for (const [k, v] of Object.entries(tpl.attributes)) {
      try {
        if (v == null) continue;
        el.setAttribute(k, String(v));
      } catch {}
    }
  }

  // 6.6) Apply content properties if they exist in the template
  if (tpl?.content && typeof tpl.content === "object") {
    applyContentProperties(el, tpl.content, tpl.tag);

    // 6.6.1) Apply variant/size (and other toggle rules) using the rule engine
    try {
      const rules = _ruleEngine.getUpdateRulesFor(el) || [];
      for (const r of rules as any[]) {
        if (r?.action === "toggleClassVariant") {
          const attr = r.whenAttr;
          const val = (tpl.content as any)[attr];
          if (val !== undefined) {
            _ruleEngine.applyUpdate(el, attr, val);
          }
        }
      }
    } catch {}
  }

  // 6.6) If this is an SVG line (rx-line), append a child <line> and set svg attributes
  if (
    String(tpl?.tag).toLowerCase() === "svg" &&
    classList.includes("rx-line")
  ) {
    try {
      const svg = el as unknown as SVGSVGElement;
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      const ns = "http://www.w3.org/2000/svg";
      const seg = document.createElementNS(ns, "line");
      seg.setAttribute("class", "segment");
      seg.setAttribute("x1", "0");
      seg.setAttribute("y1", "50");
      seg.setAttribute("x2", "100");
      seg.setAttribute("y2", "50");
      seg.setAttribute("vector-effect", "non-scaling-stroke");
      svg.appendChild(seg);
    } catch {}
  }

  // Append to canvas or target container
  const targetParent =
    (data?.containerId && document.getElementById(String(data.containerId))) ||
    canvas;
  appendTo(targetParent as HTMLElement, el);

  // If template indicates this element is a container, set role and host styles
  if (tpl?.attributes?.["data-role"] === "container") {
    (el as HTMLElement).dataset.role = "container";
    (el.style as CSSStyleDeclaration).position = "relative";
  }

  // Interactions: selection + drag via callbacks
  attachSelection(el, id, data?.onSelected);
  attachDrag(el, canvas, id, {
    onDragStart: data?.onDragStart,
    onDragMove: data?.onDragMove,
    onDragEnd: data?.onDragEnd,
  });

  // For SVG components, also attach sub-node click-to-select functionality
  if (tpl.tag === "svg" && el instanceof SVGSVGElement) {
    attachSvgNodeClick(el, id, ctx?.conductor);
  }

  ctx.payload.createdNode = {
    id,
    tag: tpl.tag,
    text: tpl.text,
    classes: [...(tpl.classes || []), instanceClass],
    style,
    position: data.position,
    css: tpl.css,
    cssVariables: cssVars,
    instanceClass,
  };
};
