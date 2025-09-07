import React from "react";
import {
  useConductor,
  resolveInteraction,
  EventRouter,
} from "@renderx/host-sdk";
import {
  groupComponentsByCategory,
  getCategoryDisplayName,
} from "../utils/library.utils.js";
import { LibraryPreview } from "./LibraryPreview";
import "./LibraryPanel.css";

export function LibraryPanel() {
  const conductor = useConductor();
  const [items, setItems] = React.useState<any[]>([]);
  const safeItems = Array.isArray(items) ? items : [];

  React.useEffect(() => {
    try {
      EventRouter.publish(
        "library.load.requested",
        {
          onComponentsLoaded: (list: any[]) => setItems(list),
        },
        conductor
      );
    } catch {
      // Fallback to direct interaction routing
      const r = resolveInteraction("library.load");
      conductor?.play?.(r.pluginId, r.sequenceId, {
        onComponentsLoaded: (list: any[]) => setItems(list),
      });
    }
  }, [conductor]);

  const groupedComponents = groupComponentsByCategory(safeItems);

  return (
    <div className="library-sidebar">
      <div className="library-sidebar-header">
        <h2 className="library-sidebar-title">🧩 Component Library</h2>
        <p className="library-sidebar-subtitle">
          Drag components to the canvas
        </p>
      </div>

      <div className="library-component-library rx-lib">
        {Object.entries(groupedComponents).map(([category, components]) => (
          <div key={category} className="library-component-category">
            <div className="library-category-title">
              {getCategoryDisplayName(category)}
            </div>
            <div className="library-component-grid">
              {components.map((component) => (
                <LibraryPreview
                  key={component.id}
                  component={component}
                  conductor={conductor}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
