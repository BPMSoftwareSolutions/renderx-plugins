# ADR-0002: JSON-driven Capability Bindings for Component Behavior

- Status: Proposed
- Date: 2025-08-17
- Owners: Plugin Architecture Working Group
- Related: ADR-0001 Orchestral Architecture (superseded by this ADR); Issue #14

## Context

We want component behavior to be component-agnostic in plugins, with components themselves declaring which plugins should drive their capabilities (drag, resize, overlay, selection, etc.). This avoids coupling plugins to component types and supports variation (e.g., Line vs Button resize) without branching inside plugins.

The system already uses the Musical Conductor pattern (play/callback) and a shared store (Prompt Book). We need a resolution layer that:

- Reads bindings from component JSON
- Falls back to type defaults and wildcard defaults
- Calls the selected plugin via conductor.play using stable plugin IDs from the manifest
- Keeps plugins ignorant of component types

## Decision

Introduce JSON-driven capability bindings with a thin runtime resolver (CapabilityBinder):

- Each component JSON may specify `behaviors` mapping capability → binding:
  - `behaviors.<capability>.plugin`: The plugin ID (manifest name/Conductor sequence id)
  - `behaviors.<capability>.config` (optional): Arbitrary config passed to the plugin payload
- The CapabilityBinder resolves the plugin ID given `(node, capability)` using precedence:
  1. Instance-level: `node.component.behaviors?.[capability]?.plugin`
  2. Type default: `defaults[ node.component.metadata.type ][ capability ]`
  3. Wildcard default: `defaults["*"][ capability ]`
  4. Otherwise: error (fail fast in dev/test)
- Orchestration uses the selected plugin ID as both channel and sequence id:
  - `conductor.play(pluginId, pluginId, payload)`
  - Phases remain in payload (e.g., `{ phase: "start" }`), never as sequence IDs

## Alignment with Architecture Vision

This decision makes the orchestration model explicitly component-agnostic and JSON-driven, aligning to the vision in four dimensions:

1. Capability ownership and isolation

- Each capability plugin owns its end-to-end behavior (inputs via Conductor, rules in Arrangements, side-effects in StageCrew, state in Prompt Book).
- Plugins do not know component types; component JSON binds capabilities to plugins.

2. Composability: use cases, profiles, solutions

- Profiles: curated defaults for a use case (e.g., forms-basic, diagramming). Resolution order extends to: instance → profile → type → wildcard.
- Solutions: bundles of profiles with pinned plugin versions for a product line; optional lockfiles for reproducibility.
- Domain registries: as domains grow, defaults/profiles can be published as packages and merged at runtime.

3. Telemetry and monitoring

- Conductor is a single entry point, so play(channel=id, id, payload) produces structured, comparable events across capabilities.
- Payload includes nodeId, capability, and optional config → easy to aggregate by capability/plugin/component type.
- Add a lightweight TelemetryAdapter that observes play() calls (or wraps conductor.play) to emit traces/metrics (duration, error counts, frequency by capability, top configs).
- Prompt Book actions/selectors provide another surface for measuring state changes.

4. Test strategy (BDD-aligned)

- Rehearsals reflect behavior-driven scenarios: Given component JSON binding X, When capability Y is played, Then state/visuals match Z.
- Layers of tests:
  - Unit: CapabilityBinder resolution precedence (+ profile context)
  - Contract: plugins use Conductor + Prompt Book only (no cross-coupling)
  - Capability rehearsals: drag/resize/overlay/selection per plugin variant
  - Use-case rehearsals: profile-level flows (e.g., forms-basic across multiple components)
  - E2E flows: solution-level scenarios with pinned plugin versions

## Telemetry Adapter Sketch

```ts
// core/telemetry/TelemetryAdapter.ts
export function wrapConductor(conductor, emitter) {
  const play = conductor.play.bind(conductor);
  conductor.play = async (channel, id, payload) => {
    const t0 = performance.now();
    try {
      const res = await play(channel, id, payload);
      emitter.emit("capability.play", {
        channel,
        id,
        duration: performance.now() - t0,
        ok: true,
        capability: payload?.capability,
        nodeId: payload?.nodeId,
      });
      return res;
    } catch (err) {
      emitter.emit("capability.play", {
        channel,
        id,
        duration: performance.now() - t0,
        ok: false,
        error: String(err),
        capability: payload?.capability,
        nodeId: payload?.nodeId,
      });
      throw err;
    }
  };
  return conductor;
}
```

## Resolution Precedence (with profiles)

1. component.behaviors[capability].plugin
2. profileDefaults[type][capability]
3. typeDefaults[type][capability]
4. wildcardDefaults["\*"][capability]
5. otherwise: error

## Migration Notes

- Start with defaults in-repo; extract to packages as domains grow
- Keep manifest “name” as the canonical plugin id used by JSON + Conductor
- Maintain test-safe fallbacks during migration; remove once all flows are concertmaster-driven

## Consequences

- Plugins remain component-agnostic; they implement capabilities and operate via Prompt Book
- Component JSONs (and defaults) decide which plugin drives a capability
- Cross-capability effects (e.g., overlay reacting to drag) happen through Prompt Book (state → selector), not direct calls between plugins
- We gain flexibility to introduce variants (e.g., `Canvas.resize.line-symphony`) and bind them per component

## Alternatives Considered

- Hardcoding plugin IDs in handlers: brittle and blocks per-component variation
- Making plugins aware of component types: couples domain concerns into plugins and increases branching

## Architecture and File Structure

- core/
  - binder/
    - CapabilityBinder.(ts|js) — resolve + play helper
  - registry/
    - defaults.json — type → capability → pluginId
    - profiles/ (future) — use-case profiles
- components/
  - library/
    - <component>.component.json — includes `metadata` and `behaviors`
- plugins/
  - manifest.json — authoritative plugin ids
  - capabilities/
    - drag/_, resize/_, overlay/_, selection/_ (variants as separate plugins)

## JSON Schemas (future work)

- `docs/schema/component.schema.json`: validates `metadata` and `behaviors`
- `docs/schema/registry.schema.json`: validates defaults/profiles
- CI step to validate all component JSONs and registries

## Example

Component JSON (Button):

```json
{
  "metadata": { "type": "button", "name": "Button" },
  "behaviors": {
    "drag": { "plugin": "Canvas.component-drag-symphony" },
    "resize": { "plugin": "Canvas.component-resize-symphony" },
    "overlay": { "plugin": "Canvas.ui-symphony" },
    "select": { "plugin": "Canvas.component-select-symphony" }
  }
}
```

Type defaults (excerpt):

```json
{
  "button": {
    "drag": "Canvas.component-drag-symphony",
    "select": "Canvas.component-select-symphony"
  },
  "*": {
    "select": "Canvas.component-select-symphony"
  }
}
```

## Runtime Contract

- Binder:
  - `resolvePluginId(node, capability) -> string | null`
  - `play(conductor, node, capability, payload) -> Promise<void>`
  - Merges payload with `config` from JSON when present, and includes `nodeId`
- Handlers/Concertmasters call binder.play for capability routing

## Profiles and Solutions (evolution path)

To scale configuration without coupling, we will support:

- Profiles — curated defaults for a use case (e.g., `forms-basic`)
  - Resolution adds a profile layer between instance and type defaults
- Solutions — productized bundles of profiles and pinned plugin versions

These are additive and do not change the core decision.

## Testing Strategy

- Rehearsals for binder resolution (explicit, type default, wildcard, error)
- Flow tests proving Canvas UI uses binder for capability routing
- Contract tests that plugins:
  - Use Conductor + Prompt Book only
  - Do not depend on component types

## Rollout Plan

1. Land CapabilityBinder + defaults.json with tests
2. Wire Canvas drag through the binder (no behavior change)
3. Add component JSONs and migrate overlay/selection
4. Introduce a line-specific resize plugin and bind it in Line JSON
5. Add schema validation in CI

## Status Tracking

- PR: feat(#14) Orchestral architecture migration + JSON-driven bindings
- This ADR will be revised as we add profiles/solutions and more capabilities
