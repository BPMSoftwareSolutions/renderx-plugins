import { updatePosition } from "./drag.stage-crew";
import { resolveInteraction, EventRouter } from "@renderx/host-sdk";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

// Coalesce CP updates to one per animation frame (latest wins)
let cpUpdateScheduled = false;
let cpUpdateLatestId: string | null = null;
let cpUpdateLatestPos: { x: number; y: number } | null = null;
let rafHandle: number | null = null;
let cpUpdateRouteCache: { pluginId: string; sequenceId: string } | null = null;

export const handlers = {
  updatePosition,
  forwardToControlPanel(data: any, ctx: any) {
    const elementId = ctx.payload?.elementId;
    const updatedPosition = ctx.payload?.updatedPosition as
      | { x: number; y: number }
      | undefined;
    if (!elementId || !ctx?.conductor?.play) return;

    // In tests, keep immediate behavior for deterministic assertions
    const isTest =
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "test";
    if (isTest) {
      try {
        // Try EventRouter first, fallback to direct routing
        try {
          EventRouter.publish(
            "control.panel.update.requested",
            {
              id: elementId,
              source: "drag",
            },
            ctx.conductor
          );
        } catch {
          const route = resolveInteraction("control.panel.update");
          ctx.conductor.play(route.pluginId, route.sequenceId, {
            id: elementId,
            source: "drag",
          });
        }
      } catch (e) {
        ctx.logger?.warn?.(
          "Failed to forward drag update to Control Panel:",
          e
        );
      }
      return;
    }

    // Apply first-move gating: avoid first CP update until a minimal delta is reached
    const perfCfg =
      (typeof globalThis !== "undefined" && (globalThis as any).__cpPerf) || {};
    const minDelta =
      typeof perfCfg.firstMoveMinDeltaPx === "number"
        ? perfCfg.firstMoveMinDeltaPx
        : 3;

    // Optional: defer first CP burst if flag enabled to avoid stacking with first paint
    const _deferFirstBurst = false; // flag available but not yet wired to scheduling

    if (updatedPosition) {
      // If we have no previous position, store and skip one update to avoid costly first derive
      if (!cpUpdateLatestPos) {
        cpUpdateLatestPos = updatedPosition;
        // Do not schedule yet; wait for next move to exceed threshold
        return;
      }
      const dx = Math.abs(updatedPosition.x - cpUpdateLatestPos.x);
      const dy = Math.abs(updatedPosition.y - cpUpdateLatestPos.y);
      if (dx < minDelta && dy < minDelta) {
        // Below threshold, update the cached pos but skip scheduling
        cpUpdateLatestPos = updatedPosition;
        return;
      }
      cpUpdateLatestPos = updatedPosition;
    }

    // Coalesce on rAF (or microtask fallback)
    cpUpdateLatestId = elementId;
    if (cpUpdateScheduled) return;
    cpUpdateScheduled = true;

    const raf =
      typeof globalThis !== "undefined" &&
      (globalThis as any).requestAnimationFrame
        ? (cb: FrameRequestCallback) =>
            (globalThis as any).requestAnimationFrame(cb)
        : (cb: Function) => setTimeout(cb as any, 0);

    const flush = () => {
      try {
        if (cpUpdateLatestId) {
          // Try EventRouter first, fallback to direct routing
          try {
            EventRouter.publish(
              "control.panel.update.requested",
              {
                id: cpUpdateLatestId,
                source: "drag",
                position: cpUpdateLatestPos,
              },
              ctx.conductor
            );
          } catch {
            if (!cpUpdateRouteCache) {
              cpUpdateRouteCache = resolveInteraction("control.panel.update");
            }
            const route = cpUpdateRouteCache;
            ctx.conductor.play(route.pluginId, route.sequenceId, {
              id: cpUpdateLatestId,
              source: "drag",
              position: cpUpdateLatestPos,
            });
          }
        }
      } catch (e) {
        ctx.logger?.warn?.(
          "Failed to forward drag update to Control Panel:",
          e
        );
      } finally {
        cpUpdateScheduled = false;
        cpUpdateLatestId = null;
        cpUpdateLatestPos = null;
        if (rafHandle != null) {
          try {
            (globalThis as any).cancelAnimationFrame?.(rafHandle);
          } catch {}
          rafHandle = null;
        }
      }
    };

    // Prefer microtask for the very first burst to reduce initial latency, then rAF
    const perf =
      (typeof globalThis !== "undefined" && (globalThis as any).__cpPerf) || {};
    const useMicrotaskFirst =
      typeof process !== "undefined" && process.env?.NODE_ENV === "test"
        ? false
        : perf.microtaskFirstUpdate !== false; // default ON unless explicitly disabled

    if (useMicrotaskFirst && !rafHandle) {
      Promise.resolve().then(flush);
      // schedule a backup rAF in case microtask gets delayed behind long tasks
      rafHandle = raf(() => flush()) as unknown as number;
    } else {
      rafHandle = raf(() => flush()) as unknown as number;
    }
  },
};
