// Shared pure builders & types for manifests (Phase 1 extraction)
// Now delegates version/schema constants to @renderx/schema-contract
// @ts-ignore: workspace local package resolution prior to build
import { MANIFEST_VERSION, InteractionManifest, InteractionRoute, TopicsManifest, TopicDef, withSchema } from '@renderx/schema-contract';

export function buildInteractionManifest(
  catalogs: Array<any>,
  componentOverrideMaps: Array<Record<string, InteractionRoute>>
): InteractionManifest {
  const routes: Record<string, InteractionRoute> = {};
  for (const cat of catalogs || []) {
    const r = cat?.routes || {};
    for (const [k, v] of Object.entries(r)) routes[k] = v as InteractionRoute;
  }
  for (const o of componentOverrideMaps || []) {
    for (const [k, v] of Object.entries(o || {})) routes[k] = v as InteractionRoute;
  }
  return withSchema({ version: MANIFEST_VERSION, routes });
}

export function buildTopicsManifest(catalogs: Array<any>): TopicsManifest {
  const topics: Record<string, TopicDef> = {};
  for (const cat of catalogs || []) {
    const t = cat?.topics || {};
    for (const [key, defAny] of Object.entries<any>(t)) {
      const def = defAny || {};
      const routes: any[] = [];
      if (def.route) routes.push(def.route);
      if (Array.isArray(def.routes)) routes.push(...def.routes);
      topics[key] = {
        routes,
        payloadSchema: def.payloadSchema || null,
        visibility: def.visibility || 'public',
        correlationKeys: Array.isArray(def.correlationKeys) ? def.correlationKeys : [],
        perf: def.perf || {},
        notes: def.notes || ''
      } as TopicDef;
    }
  }
  return withSchema({ version: MANIFEST_VERSION, topics });
}
