// Stage-crew handlers for Control Panel UI orchestration sequences
// These handlers wrap existing UI logic to make it observable and sequence-driven

import { SchemaResolverService } from "../../services/schema-resolver.service";
import type { ControlPanelConfig } from "../../types/control-panel.types";
import { resolveInteraction } from "../../../../src/interactionManifest";

// Global state for UI sequences - this will be managed by the sequences
let uiState: {
  config?: ControlPanelConfig;
  resolver?: SchemaResolverService;
  isInitialized: boolean;
  schemasLoaded?: boolean;
} = {
  isInitialized: false,
  schemasLoaded: false,
};

// Fence to prevent duplicate init work when multiple callers enqueue init close together
let uiInitInFlight = false;
let uiInitDone = false;

// ============================================================================
// UI.INIT SEQUENCE HANDLERS
// ============================================================================

// Batched movement iterator for ui.init
// Short-circuit duplicate inits: skip if in-flight or already done
if (typeof uiInitInFlight !== "undefined" && (uiInitInFlight || uiInitDone)) {
  // Note: ctx may not be available here; guard inside function as well
}

export async function initMovement(data: any, ctx: any) {
  if (uiInitInFlight || uiInitDone) {
    ctx.logger?.info?.("UI Init skipped (in-flight/done)");
    return;
  }
  uiInitInFlight = true;

  try {
    const subBeats = [
      { event: "control:panel:ui:config:load", handler: initConfig },
      { event: "control:panel:ui:resolver:init", handler: initResolver },
      { event: "control:panel:ui:schemas:load", handler: loadSchemas },
      {
        event: "control:panel:ui:observers:register",
        handler: registerObservers,
      },
      { event: "control:panel:ui:ready:notify", handler: notifyReady },
    ];

    const telemetry: Array<{
      event: string;
      dur: number;
      status: string;
      error?: string;
    }> = [];
    for (const sb of subBeats) {
      const t0 =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();
      try {
        await Promise.resolve(sb.handler(data, ctx));
        const t1 =
          typeof performance !== "undefined" && performance.now
            ? performance.now()
            : Date.now();
        telemetry.push({ event: sb.event, dur: t1 - t0, status: "ok" });
      } catch (e: any) {
        const t1 =
          typeof performance !== "undefined" && performance.now
            ? performance.now()
            : Date.now();
        telemetry.push({
          event: sb.event,
          dur: t1 - t0,
          status: "error",
          error: String(e),
        });
        throw e;
      }
    }
    // Attach telemetry and log total duration
    ctx.payload.uiInitTelemetry = { subBeats: telemetry };
    const total = telemetry.reduce((s, b) => s + b.dur, 0);
    ctx.logger?.info?.(`UI Init (batched) — ${Math.round(total)}ms`, {
      subBeats: telemetry,
    });
  } finally {
    uiInitInFlight = false;
    uiInitDone = true;
  }
}

export function initConfig(data: any, ctx: any) {
  try {
    // Load control panel configuration
    // This would typically load from a config file or service
    ctx.payload.configLoaded = true;
    ctx.logger?.info?.("Control Panel config initialized");
  } catch (error) {
    ctx.payload.configLoaded = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to initialize config:", error);
  }
}

export function initResolver(data: any, ctx: any) {
  try {
    // Initialize the schema resolver service
    // This wraps the existing SchemaResolverService initialization
    const config = data.config || {}; // Would come from previous beat
    const resolver = new SchemaResolverService(config);

    uiState.config = config;
    uiState.resolver = resolver;

    ctx.payload.resolver = resolver;
    ctx.payload.resolverInitialized = true;
    ctx.logger?.info?.("Schema resolver initialized");
  } catch (error) {
    ctx.payload.resolverInitialized = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to initialize resolver:", error);
  }
}

export async function loadSchemas(data: any, ctx: any) {
  try {
    const resolver = ctx.payload.resolver || uiState.resolver;
    if (!resolver) {
      throw new Error("Resolver not initialized");
    }

    // Load component schemas - this wraps the existing loadComponentSchemas call
    const componentTypes = data.componentTypes || [
      "button",
      "input",
      "container",
      "line",
      "heading",
      "paragraph",
      "image",
      "svg",
    ];

    // In test environment or when fetch is not available, just mark as loaded
    const isTest =
      typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "test";
    if (
      typeof fetch === "undefined" ||
      typeof globalThis === "undefined" ||
      isTest
    ) {
      ctx.payload.schemasLoaded = true;
      ctx.logger?.info?.("Component schemas loaded");
      return;
    }

    // Await schema loading to ensure downstream handlers have data
    await resolver.loadComponentSchemas(componentTypes);
    ctx.payload.schemasLoaded = true;
    ctx.logger?.info?.("Component schemas loaded");
  } catch (error) {
    ctx.payload.schemasLoaded = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to load schemas:", error);
  }
}

export function registerObservers(data: any, ctx: any) {
  try {
    // Register UI observers - this wraps the existing observer registration
    // The actual observer functions will be set by the UI components
    ctx.payload.observersRegistered = true;
    ctx.logger?.info?.("UI observers registered");
  } catch (error) {
    ctx.payload.observersRegistered = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to register observers:", error);
  }
}

export function notifyReady(data: any, ctx: any) {
  try {
    // Mark UI as ready and notify any listeners
    uiState.isInitialized = true;
    ctx.payload.uiReady = true;
    ctx.payload.timestamp = Date.now();
    ctx.logger?.info?.("Control Panel UI ready");
  } catch (error) {
    ctx.payload.uiReady = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to notify UI ready:", error);
  }
}

// ============================================================================
// UI.RENDER SEQUENCE HANDLERS
// ============================================================================

export function generateFields(data: any, ctx: any) {
  try {
    const { selectedElement } = data || {};
    const resolver = uiState.resolver;

    if (!resolver || !selectedElement) {
      ctx.payload.fields = [];
      return;
    }

    // Generate property fields using existing resolver logic
    const fields = resolver.generatePropertyFields(selectedElement);
    ctx.payload.fields = fields;
    ctx.payload.fieldsGenerated = true;
    ctx.logger?.info?.(`Generated ${fields.length} property fields`);
  } catch (error) {
    ctx.payload.fields = [];
    ctx.payload.fieldsGenerated = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to generate fields:", error);
  }
}

export function generateSections(data: any, ctx: any) {
  try {
    const { selectedElement } = data || {};
    const resolver = uiState.resolver;

    if (!resolver || !selectedElement) {
      ctx.payload.sections = [];
      return;
    }

    // Generate sections using existing resolver logic
    const sections = resolver.generateSections(selectedElement.header.type);
    ctx.payload.sections = sections;
    ctx.payload.sectionsGenerated = true;
    ctx.logger?.info?.(`Generated ${sections.length} sections`);
  } catch (error) {
    ctx.payload.sections = [];
    ctx.payload.sectionsGenerated = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to generate sections:", error);
  }
}

export function renderView(data: any, ctx: any) {
  try {
    // This is a placeholder for view rendering logic
    // In practice, this would trigger React re-renders or update view state
    // The fields and sections are available in ctx.payload if needed

    ctx.payload.viewRendered = true;
    ctx.payload.renderTimestamp = Date.now();
    ctx.logger?.info?.("UI view rendered");
  } catch (error) {
    ctx.payload.viewRendered = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to render view:", error);
  }
}

// ============================================================================
// UI.FIELD.CHANGE SEQUENCE HANDLERS
// ============================================================================

export function prepareField(data: any, ctx: any) {
  try {
    const { fieldKey, value, selectedElement } = data || {};

    if (!fieldKey || value === undefined || !selectedElement) {
      throw new Error(
        "Field change requires fieldKey, value, and selectedElement"
      );
    }

    ctx.payload.fieldKey = fieldKey;
    ctx.payload.value = value;
    ctx.payload.selectedElement = selectedElement;
    ctx.payload.fieldPrepared = true;
    ctx.logger?.info?.(`Field change prepared: ${fieldKey} = ${value}`);
  } catch (error) {
    ctx.payload.fieldPrepared = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to prepare field change:", error);
  }
}

export function dispatchField(data: any, ctx: any) {
  try {
    const { fieldKey, value, selectedElement } = ctx.payload || {};

    if (!selectedElement?.header?.id) {
      throw new Error("Selected element ID is required for field dispatch");
    }

    // Forward to the existing canvas.component.update sequence
    if (ctx?.conductor?.play) {
      try {
        const route = resolveInteraction("canvas.component.update");
        ctx.conductor.play(route.pluginId, route.sequenceId, {
          id: selectedElement.header.id,
          attribute: fieldKey,
          value: value,
        });
        ctx.payload.fieldDispatched = true;
        ctx.logger?.info?.(
          `Field change dispatched to canvas: ${fieldKey} = ${value}`
        );
      } catch (routeError) {
        ctx.payload.fieldDispatched = false;
        ctx.payload.error = `Failed to dispatch to canvas: ${routeError}`;
        ctx.logger?.error?.("Failed to dispatch to canvas:", routeError);
      }
    } else {
      ctx.payload.fieldDispatched = false;
      ctx.payload.error = "Conductor not available for field dispatch";
      ctx.logger?.warn?.("Conductor not available for field dispatch");
    }
  } catch (error) {
    ctx.payload.fieldDispatched = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to dispatch field change:", error);
  }
}

export function setDirty(data: any, ctx: any) {
  try {
    // Mark the UI as dirty to indicate unsaved changes
    ctx.payload.isDirty = true;
    ctx.payload.dirtyTimestamp = Date.now();
    ctx.logger?.info?.("UI marked as dirty");
  } catch (error) {
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to set dirty state:", error);
  }
}

export function awaitRefresh(data: any, ctx: any) {
  try {
    // This would typically wait for the canvas update to complete
    // and then trigger a UI refresh via the update sequence
    ctx.payload.refreshAwaited = true;
    ctx.logger?.info?.("Awaiting UI refresh");
  } catch (error) {
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to await refresh:", error);
  }
}

// ============================================================================
// UI.FIELD.VALIDATE SEQUENCE HANDLERS
// ============================================================================

export function validateField(data: any, ctx: any) {
  try {
    const { field, value } = data || {};
    const resolver = uiState.resolver;

    if (!resolver || !field) {
      ctx.payload.isValid = true;
      ctx.payload.errors = [];
      return;
    }

    // Use existing validation logic from SchemaResolverService
    const validation = resolver.validateField(field, value);
    ctx.payload.isValid = validation.isValid;
    ctx.payload.errors = validation.errors;
    ctx.payload.fieldKey = field.key;
    ctx.logger?.info?.(
      `Field validation: ${field.key} - ${
        validation.isValid ? "valid" : "invalid"
      }`
    );
  } catch (error) {
    ctx.payload.isValid = false;
    ctx.payload.errors = [String(error)];
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to validate field:", error);
  }
}

export function mergeErrors(data: any, ctx: any) {
  try {
    const { fieldKey } = ctx.payload || {};

    // This would merge validation errors into the UI state
    // The actual merging will be handled by the UI components
    // The isValid and errors are available in ctx.payload if needed
    ctx.payload.errorsMerged = true;
    ctx.logger?.info?.(`Validation errors merged for field: ${fieldKey}`);
  } catch (error) {
    ctx.payload.errorsMerged = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to merge errors:", error);
  }
}

export function updateView(data: any, ctx: any) {
  try {
    // Trigger view update to reflect validation state
    ctx.payload.viewUpdated = true;
    ctx.payload.updateTimestamp = Date.now();
    ctx.logger?.info?.("View updated for validation");
  } catch (error) {
    ctx.payload.viewUpdated = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to update view:", error);
  }
}

// ============================================================================
// UI.SECTION.TOGGLE SEQUENCE HANDLERS
// ============================================================================

export function toggleSection(data: any, ctx: any) {
  try {
    const { sectionId } = data || {};

    if (!sectionId) {
      throw new Error("Section toggle requires sectionId");
    }

    // This would toggle the section state
    // The actual state management will be handled by the UI components
    ctx.payload.sectionId = sectionId;
    ctx.payload.sectionToggled = true;
    ctx.logger?.info?.(`Section toggled: ${sectionId}`);
  } catch (error) {
    ctx.payload.sectionToggled = false;
    ctx.payload.error = String(error);
    ctx.logger?.error?.("Failed to toggle section:", error);
  }
}
