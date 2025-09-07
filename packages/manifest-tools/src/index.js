var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { MANIFEST_VERSION, withSchema } from "@renderx/schema-contract";
function buildInteractionManifest(catalogs, componentOverrideMaps) {
  const routes = {};
  for (const cat of catalogs || []) {
    const r = cat?.routes || {};
    for (const [k, v] of Object.entries(r)) routes[k] = v;
  }
  for (const o of componentOverrideMaps || []) {
    for (const [k, v] of Object.entries(o || {})) routes[k] = v;
  }
  return withSchema({ version: MANIFEST_VERSION, routes });
}
__name(buildInteractionManifest, "buildInteractionManifest");
function buildTopicsManifest(catalogs) {
  const topics = {};
  for (const cat of catalogs || []) {
    const t = cat?.topics || {};
    for (const [key, defAny] of Object.entries(t)) {
      const def = defAny || {};
      const routes = [];
      if (def.route) routes.push(def.route);
      if (Array.isArray(def.routes)) routes.push(...def.routes);
      topics[key] = {
        routes,
        payloadSchema: def.payloadSchema || null,
        visibility: def.visibility || "public",
        correlationKeys: Array.isArray(def.correlationKeys) ? def.correlationKeys : [],
        perf: def.perf || {},
        notes: def.notes || ""
      };
    }
  }
  return withSchema({ version: MANIFEST_VERSION, topics });
}
__name(buildTopicsManifest, "buildTopicsManifest");
export {
  buildInteractionManifest,
  buildTopicsManifest
};
