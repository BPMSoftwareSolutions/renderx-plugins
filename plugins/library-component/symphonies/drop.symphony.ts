// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.
import { EventRouter } from "@renderx/host-sdk";

export const handlers = {
  async publishCreateRequested(data: any, ctx: any) {
    const correlationId =
      data?.correlationId || crypto.randomUUID?.() || String(Date.now());
    await EventRouter.publish(
      "canvas.component.create.requested",
      {
        component: data.component,
        position: data.position,
        containerId: data.containerId,
        correlationId,
      },
      ctx.conductor
    );
  },
};
