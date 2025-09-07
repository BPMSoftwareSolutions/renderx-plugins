export function getCanvasOrThrow(): HTMLElement {
  const canvas =
    typeof document !== "undefined"
      ? document.getElementById("rx-canvas")
      : null;
  if (!canvas) throw new Error("#rx-canvas not found");
  return canvas;
}

export function createElementWithId(tag: string, id: string): HTMLElement {
  // Create with proper namespace when dealing with SVG to ensure correct element types
  let el: any;
  if (String(tag).toLowerCase() === "svg") {
    el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  } else {
    el = document.createElement(tag);
  }
  el.setAttribute("id", id);
  return el as any;
}

export function applyClasses(el: HTMLElement, classes: string[]) {
  for (const c of classes) el.classList.add(c);
}

export function applyInlineStyle(
  el: HTMLElement,
  style: Record<string, string>
) {
  Object.assign(el.style, style);
}

export function appendTo(parent: HTMLElement, child: HTMLElement) {
  parent.appendChild(child);
}
