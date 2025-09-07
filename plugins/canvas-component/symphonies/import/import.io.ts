export async function registerInstances(_data: any, ctx: any) {
  const list: any[] = ctx.payload.importComponents || [];
  for (const comp of list) {
    const kvData: any = {
      type: comp.tag,
      classes: comp.classRefs || [],
      style: comp.style || {},
      createdAt: comp.createdAt || Date.now(),
    };

    // Include content properties if they exist
    if (comp.content && Object.keys(comp.content).length > 0) {
      kvData.content = comp.content;
    }

    await ctx.io?.kv?.put?.(comp.id, kvData);
  }
}
