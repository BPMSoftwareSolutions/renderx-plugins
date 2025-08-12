/**
 * ID/Class generators for Canvas UI Plugin to preserve legacy naming:
 * rx-comp-[type]-{5-char suffix}
 */

function toKebabType(type) {
  return (type || "comp").toString().trim().toLowerCase();
}

function generateSuffix(len = 5) {
  // Simple base36 random string of desired length
  // Not cryptographic; sufficient for UI ids/classes
  let s = Math.random().toString(36).slice(2);
  if (s.length < len) s = (s + Math.random().toString(36).slice(2)).slice(0, len);
  return s.slice(0, len);
}

export function makeRxCompId(type) {
  const t = toKebabType(type);
  return `rx-comp-${t}-${generateSuffix(5)}`;
}

export function makeRxCompClass(type) {
  const t = toKebabType(type);
  return `rx-comp-${t}-${generateSuffix(5)}`;
}

