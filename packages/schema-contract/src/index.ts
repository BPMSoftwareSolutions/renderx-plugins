// Central contract for artifact schema + versions.
// Thin host + plugin build both import from here to prevent drift.

export const ARTIFACT_SCHEMA_VERSION = '1.0.0';
export const MANIFEST_VERSION = '1.0.0';

export interface InteractionRoute { pluginId: string; sequenceId: string }
export interface InteractionManifest { schemaVersion?: string; version: string; routes: Record<string, InteractionRoute> }

export interface TopicRoute { pluginId: string; sequenceId: string }
export interface TopicDef {
  routes: TopicRoute[];
  payloadSchema?: any;
  visibility?: 'public' | 'internal';
  correlationKeys?: string[];
  perf?: { throttleMs?: number; debounceMs?: number; dedupeWindowMs?: number };
  notes?: string;
}
export interface TopicsManifest { schemaVersion?: string; version: string; topics: Record<string, TopicDef> }

export interface LayoutManifest { schemaVersion?: string; layout: any; slots: any[] }

export function withSchema<T extends { version: string }>(obj: T): T & { schemaVersion: string } {
  return { schemaVersion: ARTIFACT_SCHEMA_VERSION, ...obj };
}
