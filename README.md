topics-manifest.json
## RenderX Plugins & Artifact Repository

Purpose-built repository containing raw JSON component/sequence/topic/layout/plugin definitions and build tooling that emits portable, signed artifact bundles consumable by the thin host.

### Scope (What Lives Here)
Included:
- `json-components/`, `json-sequences/`, `json-interactions/`, `json-topics/`, `json-layout/`, `json-plugins/`
- `plugins/` (UI/runtime plugin code if any compile-time steps needed)
- Build + governance scripts: `scripts/build-artifacts.js`, `validate-artifacts.js`, `verify-artifact-signature.js`, `pack-artifacts.js`, `hash-public-api.js`
- Shared schema + manifest builders: `packages/schema-contract`, `packages/manifest-tools`

Excluded (resides in thin host repo):
- Host runtime loader, conductor wiring, React shell, feature flag runtime
- Host SDK public API surface & runtime validation logic

---
### Quick Start
```
npm install
npm run artifacts:build        # build + integrity hash
npm run artifacts:validate     # structural + coverage heuristics
npm run artifacts:build:signed # build + integrity + signature
npm run artifacts:verify:signature
npm run artifacts:pack         # creates dist/packages/*.tar.gz
```
Strict mode (fail on warnings):
```
RENDERX_VALIDATION_STRICT=1 npm run artifacts:validate:strict
```

### Output Structure (dist/artifacts)
```
interaction-manifest.json
topics-manifest.json
layout-manifest.json (optional)
manifest-set.json
artifacts.integrity.json
artifacts.signature.json (if --sign used)
plugins/plugin-manifest.json
json-components/* (raw copies)
json-sequences/*  (raw copies)
...
```

### Key Commands
| Command | Purpose |
|---------|---------|
| `artifacts:build` | Build artifacts + integrity file |
| `artifacts:build:signed` | Build + integrity + Ed25519 signature (ephemeral or provided keys) |
| `artifacts:validate` | Schema consistency + plugin sequence coverage heuristic |
| `artifacts:validate:strict` | Same + escalate warnings to error |
| `artifacts:verify:signature` | Verify signature over integrity file |
| `public-api:hash` | Generate or refresh public API baseline (if exporting SDK bits here) |
| `public-api:check` | Compare against baseline (CI guard) |
| `artifacts:pack` | Tarball packaging (hash-friendly distribution) |
| `artifacts:ci` | End-to-end pipeline (signed build → strict validate → verify signature → API check → pack) |

### Environment Variables
| Var | Effect | Notes |
|-----|--------|-------|
| `RENDERX_VALIDATION_STRICT=1` | Escalate validator warnings to failures | Use in CI |
| `RENDERX_SEQUENCE_COVERAGE_ALLOW=PluginA,PluginB` | Suppress missing sequence heuristic | Pure UI / header plugins |
| `RENDERX_SIGNING_PRIVATE_PEM` / `RENDERX_SIGNING_PUBLIC_PEM` | Provide Ed25519 key pair for signing | Private key only in CI secret store |
| `RENDERX_REQUIRE_SIGNATURE=1` | Force signature presence & verification | Pair with host consumption pipeline |
| `PACK_VERSION=0.2.0` | Override version embedded in packaged tar name | Release promotion |

### Signing Flow
1. Provide PEM env vars in CI OR allow dev mode ephemeral key (auto-generated note file).
2. Run `npm run artifacts:build:signed`.
3. Verify with `npm run artifacts:verify:signature` (fails if tampered).

### CI Workflow (Recommended)
1. Checkout
2. `npm ci`
3. `npm run artifacts:build:signed`
4. `npm run artifacts:validate:strict`
5. `npm run artifacts:verify:signature`
6. `npm run public-api:check` (optional if baseline managed here)
7. `npm run artifacts:pack`
8. Upload `dist/artifacts/` + `dist/packages/*.tar.gz` (or publish)

### Consuming From Thin Host
In host pipeline:
1. Download artifact bundle (or unpack tar) to a path.
2. Set `HOST_ARTIFACTS_DIR=/path/to/artifacts` before host build/start.
3. Enable enforcement: `RENDERX_REQUIRE_SIGNATURE=1` for provenance.

### Schema & Versioning
`packages/schema-contract` centralizes `ARTIFACT_SCHEMA_VERSION`. Increment when breaking manifest shape; keep host & plugins in lockstep.

### Public API Governance (Optional Here)
If this repo later ships build-time utilities consumed by third parties, maintain `public-api.hash.json` via `public-api:hash` / `public-api:check` to catch accidental exports drift.

### Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ERR_UNKNOWN_FILE_EXTENSION .ts` | Script importing TS directly | Use JS shims or compile first |
| Validation warning: coverage | Plugin lacks sequences (heuristic) | Add to allowlist or supply sequence |
| Signature verify fails | Integrity file modified post-sign | Rebuild & resign; check CI order |
| Packed tar missing files | Ran pack before build | Run `artifacts:build` first |

### Roadmap (Future Enhancements)
- Extended integrity coverage to raw JSON catalogs
- Reproducible build diff (determinism check)
- API diff report (pretty output) for baseline changes
- Multi-artifact set version negotiation (future host feature)

### License
Add chosen license (e.g. MIT) here.

---
This repository intentionally excludes host runtime concerns; its only contract with the host is the artifact directory + optional signature. Keep changes small, additive, and schema-version any breaking manifest adjustments.
