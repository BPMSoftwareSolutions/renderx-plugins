import React from "react";
import { resolveInteraction, EventRouter } from "@renderx/host-sdk";
import { computePreviewModel } from "./preview.model";
import { varsToStyle, pickDataAttrs } from "../utils/library.utils.js";
import "./LibraryPanel.css";

export function LibraryPreview({
  component,
  conductor,
}: {
  component: any;
  conductor: any;
}) {
  const model = computePreviewModel(component);
  const hostDataAttrs = pickDataAttrs(model.attributes);
  const name = component?.name || component?.template?.name || "Component";
  const description =
    component?.template?.attributes?.["data-description"] ||
    component?.metadata?.description ||
    `${name} component`;
  const icon = component?.template?.attributes?.["data-icon"] || "🧩";

  const handleDragStart = (e: React.DragEvent) => {
    try {
      EventRouter.publish(
        "library.component.drag.start.requested",
        {
          event: "library:component:drag:start",
          domEvent: e,
          component,
        },
        conductor
      );
    } catch {
      // Fallback to direct interaction routing
      const r = resolveInteraction("library.component.drag.start");
      conductor?.play?.(r.pluginId, r.sequenceId, {
        event: "library:component:drag:start",
        domEvent: e,
        component,
      });
    }
  };

  return (
    <div
      className="library-component-item"
      style={varsToStyle(model.cssVars)}
      {...hostDataAttrs}
      draggable
      onDragStart={handleDragStart}
    >
      {model.cssText && <style>{model.cssText}</style>}
      {model.cssTextLibrary && <style>{model.cssTextLibrary}</style>}
      <span className="library-component-icon">{icon}</span>
      <div className="library-component-name">{name}</div>
      <div className="library-component-description">{description}</div>
    </div>
  );
}
