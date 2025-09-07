import { deriveSelectionModel } from "./selection.stage-crew";
import { getSelectionObserver } from "../../state/observer.store";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  deriveSelectionModel,
  notifyUi(data: any, ctx: any) {
    const observer = getSelectionObserver();
    const selectionModel = ctx.payload?.selectionModel;

    if (observer && selectionModel) {
      try {
        observer(selectionModel);
      } catch (e) {
        ctx.logger?.warn?.("Control Panel selection observer error:", e);
      }
    }

    // Publish selection changed topic to allow other subscribers (e.g., overlays)
    try {
      const { EventRouter } = require("../../../../src/EventRouter");
      const id = selectionModel?.header?.id || data?.id;
      if (id) {
        EventRouter.publish(
          "canvas.component.selection.changed",
          { id },
          ctx.conductor
        );
      }
    } catch {}
  },
};
