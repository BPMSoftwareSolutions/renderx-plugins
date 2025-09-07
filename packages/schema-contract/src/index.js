var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const ARTIFACT_SCHEMA_VERSION = "1.0.0";
const MANIFEST_VERSION = "1.0.0";
function withSchema(obj) {
  return { schemaVersion: ARTIFACT_SCHEMA_VERSION, ...obj };
}
__name(withSchema, "withSchema");
export {
  ARTIFACT_SCHEMA_VERSION,
  MANIFEST_VERSION,
  withSchema
};
