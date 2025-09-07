/**
 * Utility functions for field operations
 */

/**
 * Get nested value from object using dot notation path
 */
export function getNestedValue(obj: any, path: string) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object using dot notation path
 */
export function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Format field label from camelCase or kebab-case
 */
export function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/-/g, ' ')
    .replace(/_/g, ' ');
}

/**
 * Generate placeholder text for field
 */
export function generatePlaceholder(key: string, type: string): string {
  if (type === 'number') return '0';
  if (key.includes('color')) return '#007acc';
  if (key.includes('size') || key.includes('radius')) return '4px';
  return `Enter ${key}...`;
}
