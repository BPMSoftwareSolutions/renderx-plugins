export const resolveTemplate = (data: any, ctx: any) => {
  const tpl = data?.component?.template;
  if (!tpl) throw new Error("Missing component template.");
  ctx.payload.template = tpl;

  // Support ID override for import scenarios
  // If _overrideNodeId is provided, use it; otherwise generate a new one
  ctx.payload.nodeId =
    data._overrideNodeId || `rx-node-${Math.random().toString(36).slice(2, 8)}`;
};
