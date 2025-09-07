// Stage-crew handlers for adding/removing CSS classes on canvas elements

export function addClass(data: any, ctx: any) {
  const { id, className } = data || {};
  if (!id || !className) return;

  const element = document.getElementById(String(id)) as HTMLElement | null;
  if (!element) return;

  element.classList.add(className);
  
  // Store updated classes in payload for UI notification
  ctx.payload.id = id;
  ctx.payload.updatedClasses = Array.from(element.classList);
}

export function removeClass(data: any, ctx: any) {
  const { id, className } = data || {};
  if (!id || !className) return;

  const element = document.getElementById(String(id)) as HTMLElement | null;
  if (!element) return;

  element.classList.remove(className);
  
  // Store updated classes in payload for UI notification
  ctx.payload.id = id;
  ctx.payload.updatedClasses = Array.from(element.classList);
}
