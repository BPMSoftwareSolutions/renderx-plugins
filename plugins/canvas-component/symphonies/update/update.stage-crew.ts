// Stage-crew handler for updating Canvas component attributes from Control Panel changes
import { ComponentRuleEngine } from "../../../../src/component-mapper/rule-engine";
import { EventRouter } from "../../../../src/EventRouter";

const ruleEngine = new ComponentRuleEngine();

export function updateAttribute(data: any, ctx: any) {
  const { id, attribute, value } = data || {};

  if (!id || !attribute || value === undefined) {
    ctx.logger?.warn?.(
      "Canvas component update requires id, attribute, and value"
    );
    return;
  }

  const element = document.getElementById(String(id)) as HTMLElement | null;
  if (!element) {
    ctx.logger?.warn?.(`Canvas component with id ${id} not found`);
    return;
  }

  try {
    const applied = ruleEngine.applyUpdate(element, String(attribute), value);
    if (!applied) {
      ctx.logger?.warn?.(`Unknown attribute: ${attribute}`);
      return;
    }

    // Store the updated attribute info for potential use by other handlers
    ctx.payload.updatedAttribute = { id, attribute, value };
    ctx.payload.elementId = id;
  } catch (error) {
    ctx.logger?.warn?.(`Failed to update attribute ${attribute}:`, error);
  }
}

export function refreshControlPanel(data: any, ctx: any) {
  // After updating the Canvas component, refresh the Control Panel to show the changes
  const elementId = ctx.payload?.elementId;

  if (elementId && ctx?.conductor?.play) {
    try {
      // Try to use resolveInteraction, fallback to direct route for tests
      let pluginId = "ControlPanelPlugin";
      let sequenceId = "control-panel-update-symphony";

      // Try EventRouter first, fallback to direct routing
      try {
        EventRouter.publish(
          "control.panel.update.requested",
          {
            id: elementId,
            source: "attribute-update",
          },
          ctx.conductor
        );
      } catch {
        try {
          const {
            resolveInteraction,
          } = require("../../../../src/interactionManifest");
          const route = resolveInteraction("control.panel.update");
          pluginId = route.pluginId;
          sequenceId = route.sequenceId;
        } catch {
          // Fallback to hardcoded values for test environment
        }

        // eslint-disable-next-line play-routing/no-hardcoded-play-ids
        ctx.conductor.play(pluginId, sequenceId, {
          id: elementId,
          source: "attribute-update",
        });
      }
    } catch (error) {
      ctx.logger?.warn?.(
        "Failed to refresh Control Panel after attribute update:",
        error
      );
    }
  }
}
