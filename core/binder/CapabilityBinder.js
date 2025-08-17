const path = require("path");
const fs = require("fs");

let __defaultsCache = null;
function getDefaults() {
  if (__defaultsCache) return __defaultsCache;
  try {
    const p = path.resolve(__dirname, "../registry/defaults.json");
    const raw = fs.readFileSync(p, "utf8");
    __defaultsCache = JSON.parse(raw);
    return __defaultsCache;
  } catch {
    __defaultsCache = { "*": {} };
    return __defaultsCache;
  }
}

function resolvePluginId(node, capability) {
  const type = node?.component?.metadata?.type;
  const behaviors = node?.component?.behaviors || {};
  const explicit = behaviors?.[capability]?.plugin;
  if (explicit && typeof explicit === "string") return explicit;

  const defaults = getDefaults();
  if (type && defaults[type] && defaults[type][capability])
    return defaults[type][capability];
  if (defaults["*"] && defaults["*"][capability])
    return defaults["*"][capability];
  return null;
}

async function play(conductor, node, capability, payload = {}) {
  const id = resolvePluginId(node, capability);
  if (!id)
    throw new Error(`No plugin id resolved for capability '${capability}'`);
  const config = node?.component?.behaviors?.[capability]?.config;
  const finalPayload = {
    ...payload,
    ...(config ? { config } : {}),
    nodeId: node?.id,
  };
  return conductor.play(id, id, finalPayload);
}

module.exports = { resolvePluginId, play };
