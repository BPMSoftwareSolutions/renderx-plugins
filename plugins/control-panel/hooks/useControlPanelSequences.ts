import React from "react";
import {
  useConductor,
  resolveInteraction,
  EventRouter,
} from "@renderx/host-sdk";
import type { SelectedElement } from "../types/control-panel.types";

// Global guards to dedupe init across multiple hook instances/mounts
let cpInitInFlight = false;
let cpInitialized = false;

/**
 * Hook to orchestrate Control Panel UI via sequences
 * This provides a thin layer over the existing UI logic to make it sequence-driven
 */
export function useControlPanelSequences() {
  const conductor = useConductor();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const pendingRender = React.useRef<SelectedElement | null>(null);

  // Initialize UI sequences on mount (global dedupe across instances)
  React.useEffect(() => {
    if (!conductor || isInitialized || cpInitialized || cpInitInFlight) return;

    const initializeUI = async () => {
      cpInitInFlight = true;
      try {
        const perf = (globalThis as any).__cpPerf || {};
        const key = perf.batchedInit
          ? "control.panel.ui.init.batched"
          : "control.panel.ui.init";
        const route = resolveInteraction(key);
        await conductor.play(route.pluginId, route.sequenceId, {
          componentTypes: ["button", "input", "container", "line"],
        });
        cpInitialized = true;
        setIsInitialized(true);
      } catch {
        // Silently handle initialization failures to avoid infinite retries
        cpInitialized = true; // avoid infinite retries
        setIsInitialized(true);
      } finally {
        cpInitInFlight = false;
        // Flush a pending render if one was queued during init
        if (pendingRender.current) {
          try {
            const route = resolveInteraction("control.panel.ui.render");
            conductor.play(route.pluginId, route.sequenceId, {
              selectedElement: pendingRender.current,
            });
          } catch {
            // Silently ignore deferred render failures
          } finally {
            pendingRender.current = null;
          }
        }
      }
    };

    initializeUI();
  }, [conductor, isInitialized]);

  // Trigger UI render sequence when selected element changes
  const triggerRender = React.useCallback(
    (selectedElement: SelectedElement | null) => {
      if (!conductor) return;

      // Skip render while dragging for performance
      if (
        typeof globalThis !== "undefined" &&
        (globalThis as any).__cpDragInProgress
      ) {
        return;
      }

      // If init hasn't completed yet, queue a single pending render to run post-init
      if (!isInitialized || !cpInitialized || cpInitInFlight) {
        pendingRender.current = selectedElement;
        return;
      }

      try {
        EventRouter.publish(
          "control.panel.ui.render.requested",
          { selectedElement },
          conductor
        );
      } catch {
        // Fallback to direct interaction routing
        try {
          const route = resolveInteraction("control.panel.ui.render");
          conductor.play(route.pluginId, route.sequenceId, { selectedElement });
        } catch {
          // Silently ignore render sequence failures
        }
      }
    },
    [conductor, isInitialized]
  );

  // Expose a globally callable trigger for optional deferred post-drag rendering
  React.useEffect(() => {
    if (typeof globalThis === "undefined") return;
    (globalThis as any).__cpTriggerRender = () => triggerRender(null);
    return () => {
      try {
        if ((globalThis as any).__cpTriggerRender)
          delete (globalThis as any).__cpTriggerRender;
      } catch {}
    };
  }, [triggerRender]);

  // Handle field changes via sequence
  const handleFieldChange = React.useCallback(
    (fieldKey: string, value: any, selectedElement: SelectedElement | null) => {
      if (!conductor || !isInitialized || !selectedElement) return;

      try {
        EventRouter.publish(
          "control.panel.ui.field.change.requested",
          {
            fieldKey,
            value,
            selectedElement,
          },
          conductor
        );
      } catch {
        // Fallback to direct interaction routing
        try {
          const route = resolveInteraction("control.panel.ui.field.change");
          conductor.play(route.pluginId, route.sequenceId, {
            fieldKey,
            value,
            selectedElement,
          });
        } catch {
          // Silently ignore field change sequence failures
        }
      }
    },
    [conductor, isInitialized]
  );

  // Handle field validation via sequence
  const handleFieldValidation = React.useCallback(
    (field: any, value: any) => {
      if (!conductor || !isInitialized) return;

      try {
        EventRouter.publish(
          "control.panel.ui.field.validate.requested",
          {
            fieldKey: field?.key || field,
            value,
            selectedElement: field,
          },
          conductor
        );
      } catch {
        // Fallback to direct interaction routing
        try {
          const route = resolveInteraction("control.panel.ui.field.validate");
          conductor.play(route.pluginId, route.sequenceId, { field, value });
        } catch {
          // Silently ignore field validation sequence failures
        }
      }
    },
    [conductor, isInitialized]
  );

  // Handle section toggle via sequence
  const handleSectionToggle = React.useCallback(
    (sectionId: string) => {
      if (!conductor || !isInitialized) return;

      try {
        EventRouter.publish(
          "control.panel.ui.section.toggle.requested",
          { sectionId },
          conductor
        );
      } catch {
        // Fallback to direct interaction routing
        try {
          const route = resolveInteraction("control.panel.ui.section.toggle");
          conductor.play(route.pluginId, route.sequenceId, { sectionId });
        } catch {
          // Silently ignore section toggle sequence failures
        }
      }
    },
    [conductor, isInitialized]
  );

  return {
    isInitialized,
    triggerRender,
    handleFieldChange,
    handleFieldValidation,
    handleSectionToggle,
  };
}
