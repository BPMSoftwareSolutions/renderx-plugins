export const queryAllComponents = async (data: any, ctx: any) => {
  try {
    ctx.logger?.info?.("Querying all components from KV store");

    let components: any[] = [];

    // Try to get components from KV store if available
    if (ctx.io?.kv?.getAll) {
      try {
        components = await ctx.io.kv.getAll();
        ctx.logger?.info?.(
          `KV store available, found ${components?.length || 0} components`
        );
      } catch (kvError) {
        ctx.logger?.warn?.("KV store error:", kvError);
        components = [];
      }
    } else {
      ctx.logger?.info?.("KV store not available");
    }

    // If KV store is empty, request DOM discovery via stage-crew handler
    if (!components || components.length === 0) {
      ctx.logger?.info?.("KV store empty, requesting DOM discovery for export");
      // Stage-crew beats will populate ctx.payload.components via DOM discovery when KV is empty
      components = ctx.payload.components || [];
    }

    ctx.payload.components = components || [];
    ctx.payload.componentCount = components?.length || 0;
    if (!ctx.payload.source) ctx.payload.source = "kv-store";
    ctx.logger?.info?.(
      `Retrieved ${ctx.payload.componentCount} components from ${ctx.payload.source}`
    );
  } catch (error) {
    ctx.logger?.error?.("Failed to query components:", error);
    ctx.payload.error = String(error);
    ctx.payload.components = [];
    ctx.payload.componentCount = 0;
  }
};
