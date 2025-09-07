// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.
import {
  ensurePayload,
  computeGhostSize,
  createGhostContainer,
  renderTemplatePreview,
  applyTemplateStyles,
  computeCursorOffsets,
  installDragImage,
} from "./drag/drag.preview.stage-crew";

export const handlers = {
  onDragStart(data: any) {
    const e = data?.domEvent;
    const dt = e?.dataTransfer as DataTransfer | undefined;

    ensurePayload(dt, data?.component);

    try {
      if (dt?.setDragImage) {
        const { width, height, targetEl } = computeGhostSize(
          e,
          data?.component
        );
        const ghost = createGhostContainer(width, height);
        renderTemplatePreview(ghost, data?.component?.template, width, height);
        applyTemplateStyles(ghost, data?.component?.template);
        const { offsetX, offsetY } = computeCursorOffsets(
          e,
          targetEl,
          width,
          height
        );
        installDragImage(dt, ghost, offsetX, offsetY);
      }
    } catch {
      // Best-effort: continue without a custom drag image
    }

    return { started: true };
  },
};
