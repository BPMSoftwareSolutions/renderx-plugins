import { ensureOverlay } from "./select.overlay.dom.stage-crew";
import { attachResizeHandlers } from "./select.overlay.resize.stage-crew";
import { applyOverlayRectForEl } from "./select.overlay.dom.stage-crew";
import { useConductor } from "../../../../src/conductor";
import { isFlagEnabled } from "../../../../src/feature-flags/flags";
import {
  ensureAdvancedLineOverlayFor,
  attachAdvancedLineManipHandlers,
} from "./select.overlay.line-advanced.stage-crew";

function configureHandlesVisibility(ov: HTMLDivElement, targetEl: HTMLElement) {
  const handlesAttr = targetEl.getAttribute("data-resize-handles");
  const allow = new Set(
    (handlesAttr || "nw,n,ne,e,se,s,sw,w")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const handleEls = ov.querySelectorAll<HTMLDivElement>(".rx-handle");
  handleEls.forEach((h) => {
    const dir = Array.from(h.classList).find((c) =>
      ["n", "s", "e", "w", "nw", "ne", "sw", "se"].includes(c)
    );
    (h.style as CSSStyleDeclaration).display =
      dir && allow.has(dir) ? "block" : "none";
  });
}

export function showSelectionOverlay(data: any, ctx?: any) {
  const { id } = data || {};
  if (!id) return;
  const el = document.getElementById(String(id)) as HTMLElement | null;
  if (!el) return;

  // Standard overlay by default; only switch to endpoint overlay when explicitly requested via data-overlay
  const overlayMode = (el.getAttribute("data-overlay") || "")
    .trim()
    .toLowerCase();
  const wantsEndpointOverlay =
    overlayMode === "line-advanced" || overlayMode === "line-endpoints";
  const isSvgLine =
    el.tagName?.toLowerCase() === "svg" && el.classList.contains("rx-line");
  const isAdvancedLine =
    isFlagEnabled("lineAdvanced") &&
    el.classList.contains("rx-line") &&
    (wantsEndpointOverlay || isSvgLine);

  // Use conductor from context if provided, otherwise get from global context
  const conductor = ctx?.conductor || useConductor();

  if (!isAdvancedLine) {
    const ov = ensureOverlay();
    attachResizeHandlers(ov, conductor);
    ov.dataset.targetId = String(id);
    configureHandlesVisibility(ov, el);
    ov.style.display = "block";
    applyOverlayRectForEl(ov, el);
  } else {
    // Hide the standard rectangular overlay for line components
    const ov = document.getElementById(
      "rx-selection-overlay"
    ) as HTMLDivElement | null;
    if (ov) ov.style.display = "none";
  }

  // Advanced Line overlay (feature-flag gated): endpoint handles only
  try {
    if (isAdvancedLine) {
      const adv = ensureAdvancedLineOverlayFor(el);
      adv.dataset.targetId = String(id);
      attachAdvancedLineManipHandlers(adv, conductor);
      adv.style.display = "block";
    }
  } catch {}
}

export function hideSelectionOverlay() {
  const ov = document.getElementById(
    "rx-selection-overlay"
  ) as HTMLDivElement | null;
  if (ov) ov.style.display = "none";
}
