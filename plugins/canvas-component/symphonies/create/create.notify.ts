import { EventRouter } from "@renderx/host-sdk";

export const notifyUi = (data: any, ctx: any) => {
  const created = ctx.payload?.createdNode;
  // Backward-compat: still invoke callback if provided (tests rely on this)
  data?.onComponentCreated?.(created);

  const id = created?.id || ctx.payload?.id;
  const correlationId = ctx.payload?.correlationId || data?.correlationId;
  if (id && correlationId) {
    EventRouter.publish(
      "canvas.component.created",
      { id, correlationId },
      ctx.conductor
    );
  }
};
