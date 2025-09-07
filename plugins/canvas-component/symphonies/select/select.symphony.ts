import { showSelectionOverlay } from "./select.stage-crew";
import { resolveInteraction, EventRouter } from "@renderx/host-sdk";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

export const handlers = {
  showSelectionOverlay,
  notifyUi(data: any, ctx: any) {
    // Original UI notification
    data?.onSelected?.(data?.id);

    // Forward to Control Panel selection symphony
    if (data?.id && ctx?.conductor?.play) {
      try {
        EventRouter.publish(
          "control.panel.selection.show.requested",
          { id: data.id },
          ctx.conductor
        );
      } catch {
        // Fallback to direct interaction routing
        try {
          const route = resolveInteraction("control.panel.selection.show");
          ctx.conductor.play(route.pluginId, route.sequenceId, { id: data.id });
        } catch (e) {
          ctx.logger?.warn?.(
            "Failed to forward selection to Control Panel:",
            e
          );
        }
      }
    }
  },
};
