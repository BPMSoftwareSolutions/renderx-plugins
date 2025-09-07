export const registerInstance = async (data: any, ctx: any) => {
  const { nodeId, template } = ctx.payload || {};
  if (!nodeId || !template)
    throw new Error("Missing nodeId/template in payload for IO registration");

  // Examples of IO responsibilities:
  // - persist node metadata to a KV/registry
  // - write undo snapshot / change journal
  // - cache template/style blob for quick rehydrate
  const kvData: any = {
    type: template.tag,
    classes: template.classes,
    style: template.style,
    createdAt: Date.now(),
  };

  // Include content properties if they exist in the template
  if (template.content && Object.keys(template.content).length > 0) {
    kvData.content = template.content;
  }

  await ctx.io?.kv?.put?.(nodeId, kvData);
  // (optional)
  // await ctx.io?.cache?.put?.(`tpl:${template.tag}`, template);
};
