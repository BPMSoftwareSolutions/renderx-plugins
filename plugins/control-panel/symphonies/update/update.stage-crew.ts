// Stage-crew handler for updating Control Panel with current element state during live operations
import { ComponentRuleEngine } from "../../../../src/component-mapper/rule-engine";

const _ruleEngine = new ComponentRuleEngine();

// Cache last known element size to avoid repeated width/height reads during drag
let lastSizeById: Record<string, { width: number; height: number }> = {};
// Cache type during drag bursts to avoid repeated classList scans
let lastTypeById: Record<string, string> = {};

export function updateFromElement(data: any, ctx: any) {
  const { id, source } = data || {};
  if (!id) {
    ctx.payload.selectionModel = null;
    return;
  }

  const element = document.getElementById(String(id)) as HTMLElement | null;
  if (!element) {
    ctx.payload.selectionModel = null;
    return;
  }

  // Extract type from rx-<type> class (memoized during drag)
  let type: string | undefined;
  const cachedType = lastTypeById[id as string];
  if (cachedType && (source === "drag" || source === "resize")) {
    type = cachedType;
  } else {
    const rxClasses = Array.from(element.classList).filter(
      (cls) => cls.startsWith("rx-") && cls !== "rx-comp"
    );
    const typeClass = rxClasses[0]; // e.g., "rx-button"
    type = typeClass ? typeClass.replace("rx-", "") : "unknown";
    if (source === "drag" || source === "resize") {
      lastTypeById[id as string] = type;
    }
  }

  // Get current position and dimensions from inline styles (preferred) or computed styles
  const style = element.style;
  const computed = getComputedStyle(element);

  // During drag/resize, consume position/size from data if provided to avoid reflow-causing reads
  if (source === "drag" || source === "resize") {
    const pos = (data && (data as any).position) as
      | { x?: number; y?: number }
      | undefined;
    const size = (data && (data as any).size) as
      | { width?: number; height?: number }
      | undefined;
    const x =
      pos && typeof pos.x === "number"
        ? pos.x
        : parseFloat(style.left || computed.left || "0");
    const y =
      pos && typeof pos.y === "number"
        ? pos.y
        : parseFloat(style.top || computed.top || "0");
    let width: number;
    let height: number;

    if (source === "resize") {
      // Prefer forwarded size during resize to avoid layout reads
      if (
        size &&
        typeof size.width === "number" &&
        typeof size.height === "number"
      ) {
        width = size.width;
        height = size.height;
        lastSizeById[id as string] = { width, height };
      } else {
        const cached = lastSizeById[id as string];
        if (cached) {
          ({ width, height } = cached);
        } else {
          width = parseFloat(style.width || computed.width || "0");
          height = parseFloat(style.height || computed.height || "0");
          lastSizeById[id as string] = { width, height };
        }
      }
    } else {
      // drag: width/height typically unchanged, use cache then fallback
      const cached = lastSizeById[id as string];
      if (cached) {
        ({ width, height } = cached);
      } else {
        width = parseFloat(style.width || computed.width || "0");
        height = parseFloat(style.height || computed.height || "0");
        lastSizeById[id as string] = { width, height };
      }
    }

    ctx.payload.selectionModel = {
      header: { type, id },
      layout: { x, y, width, height },
    };
    ctx.payload._source = source;
    return;
  }

  const x = parseFloat(style.left || computed.left || "0");
  const y = parseFloat(style.top || computed.top || "0");
  const width = parseFloat(style.width || computed.width || "0");
  const height = parseFloat(style.height || computed.height || "0");

  // Extract content using rule engine for component-specific properties
  const content = _ruleEngine.extractContent(element, type);

  // Build full selection model with current DOM state for non-drag cases
  const selectionModel = {
    header: { type, id },
    content,
    layout: { x, y, width, height },
    styling: {
      "bg-color": computed.backgroundColor || "#007acc",
      "text-color": computed.color || "#ffffff",
      "border-radius": computed.borderRadius || "4px",
      "font-size": computed.fontSize || "14px",
    },
    classes: Array.from(element.classList),
  };

  ctx.payload.selectionModel = selectionModel;
  ctx.payload._source = source;
}
