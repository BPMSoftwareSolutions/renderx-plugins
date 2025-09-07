import { updateSize } from "./resize.stage-crew";
import { resolveInteraction, EventRouter } from "@renderx/host-sdk";

// NOTE: Runtime sequences are mounted from JSON (see json-sequences/*). This file only exports handlers.

// Coalesce CP updates to one per animation frame (latest wins) for resize
let cpUpdateScheduled = false;
let cpUpdateLatestId: string | null = null;
let cpUpdateLatestLayout: {
  x: number;
  y: number;
  width: number;
  height: number;
} | null = null;
let rafHandle: number | null = null;
let cpUpdateRouteCache: { pluginId: string; sequenceId: string } | null = null;

export const handlers = {
  updateSize,
  forwardToControlPanel(data: any, ctx: any) {
    const elementId = ctx.payload?.elementId;
    const updatedLayout = ctx.payload?.updatedLayout as
      | { x: number; y: number; width: number; height: number }
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
              source: "resize",
              position: updatedLayout
                ? { x: updatedLayout.x, y: updatedLayout.y }
                : undefined,
              size: updatedLayout
                ? { width: updatedLayout.width, height: updatedLayout.height }
                : undefined,
            },
            ctx.conductor
          );
        } catch {
          const route = resolveInteraction("control.panel.update");
          ctx.conductor.play(route.pluginId, route.sequenceId, {
            id: elementId,
            source: "resize",
            position: updatedLayout
              ? { x: updatedLayout.x, y: updatedLayout.y }
              : undefined,
            size: updatedLayout
              ? { width: updatedLayout.width, height: updatedLayout.height }
              : undefined,
          });
        }
      } catch (e) {
        ctx.logger?.warn?.(
          "Failed to forward resize update to Control Panel:",
          e
        );
      }
      return;
    }

    // Apply first-delta gating to suppress jitter
    const perfCfg =
      (typeof globalThis !== "undefined" && (globalThis as any).__cpPerf) || {};
    const minDelta =
      typeof perfCfg.firstResizeMinDeltaPx === "number"
        ? perfCfg.firstResizeMinDeltaPx
        : 3;

    if (updatedLayout) {
      if (!cpUpdateLatestLayout) {
        cpUpdateLatestLayout = updatedLayout;
        return; // wait for next move to exceed threshold
      }
      const dx = Math.abs(updatedLayout.x - cpUpdateLatestLayout.x);
      const dy = Math.abs(updatedLayout.y - cpUpdateLatestLayout.y);
      const dw = Math.abs(updatedLayout.width - cpUpdateLatestLayout.width);
      const dh = Math.abs(updatedLayout.height - cpUpdateLatestLayout.height);
      if (dx < minDelta && dy < minDelta && dw < minDelta && dh < minDelta) {
        cpUpdateLatestLayout = updatedLayout;
        return;
      }
      cpUpdateLatestLayout = updatedLayout;
    }

    // Coalesce on rAF (or microtask fallback like drag)
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
          const pos = cpUpdateLatestLayout
            ? { x: cpUpdateLatestLayout.x, y: cpUpdateLatestLayout.y }
            : undefined;
          const size = cpUpdateLatestLayout
            ? {
                width: cpUpdateLatestLayout.width,
                height: cpUpdateLatestLayout.height,
              }
            : undefined;

          // Try EventRouter first, fallback to direct routing
          try {
            EventRouter.publish(
              "control.panel.update.requested",
              {
                id: cpUpdateLatestId,
                source: "resize",
                position: pos,
                size,
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
              source: "resize",
              position: pos,
              size,
            });
          }
        }
      } catch (e) {
        ctx.logger?.warn?.(
          "Failed to forward resize update to Control Panel:",
          e
        );
      } finally {
        cpUpdateScheduled = false;
        cpUpdateLatestId = null;
        cpUpdateLatestLayout = null;
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
