import React from "react";
import type { FieldRendererProps } from "../../types/control-panel.types";
import { useConductor, EventRouter } from "@renderx/host-sdk";

type SvgNodeAttributes = {
  // Common attributes
  fill?: string;
  stroke?: string;
  "stroke-width"?: string;
  opacity?: string;

  // Rect attributes
  x?: string;
  y?: string;
  width?: string;
  height?: string;

  // Circle attributes
  cx?: string;
  cy?: string;
  r?: string;
};

type NodeType = "rect" | "circle" | "generic";

function getNodeTypeFromTag(tag: string): NodeType {
  switch (tag.toLowerCase()) {
    case "rect":
      return "rect";
    case "circle":
      return "circle";
    default:
      return "generic";
  }
}

function getAttributesForNodeType(nodeType: NodeType): Array<{
  key: keyof SvgNodeAttributes;
  label: string;
  type: "color" | "number" | "text";
}> {
  const common = [
    { key: "fill" as const, label: "Fill", type: "color" as const },
    { key: "stroke" as const, label: "Stroke", type: "color" as const },
    {
      key: "stroke-width" as const,
      label: "Stroke Width",
      type: "number" as const,
    },
    { key: "opacity" as const, label: "Opacity", type: "number" as const },
  ];

  switch (nodeType) {
    case "rect":
      return [
        ...common,
        { key: "x", label: "X", type: "number" },
        { key: "y", label: "Y", type: "number" },
        { key: "width", label: "Width", type: "number" },
        { key: "height", label: "Height", type: "number" },
      ];
    case "circle":
      return [
        ...common,
        { key: "cx", label: "Center X", type: "number" },
        { key: "cy", label: "Center Y", type: "number" },
        { key: "r", label: "Radius", type: "number" },
      ];
    default:
      return common;
  }
}

export const SvgNodeInspector: React.FC<FieldRendererProps> = (
  props: FieldRendererProps
) => {
  const { selectedElement } = props;
  const conductor = useConductor();
  const id = selectedElement?.header?.id;
  const [selectedPath, setSelectedPath] = React.useState<string>("");
  const [selectedNode, setSelectedNode] = React.useState<{
    tag: string;
  } | null>(null);
  const [nodeAttributes, setNodeAttributes] = React.useState<SvgNodeAttributes>(
    {}
  );

  // Sync selection when canvas confirms the sub-node selection
  React.useEffect(() => {
    const unsub = EventRouter.subscribe(
      "canvas.component.select.svg-node.changed",
      (p: any) => {
        const targetId = String(p?.id || "");
        if (!targetId || targetId !== String(id || "")) return;

        const path = String(p?.path || "");
        setSelectedPath(path);

        // Use payload data provided by stage-crew (tag + attributes)
        const tag = String(p?.tag || "generic");
        const attributes = (p?.attributes || {}) as SvgNodeAttributes;
        setSelectedNode({ tag });
        setNodeAttributes(attributes);
      }
    );
    return () => unsub?.();
  }, [id]);

  const handleAttributeChange = async (attribute: string, value: string) => {
    if (!id || !selectedPath || !conductor?.play) return;

    try {
      // Update local state immediately for responsive UI
      setNodeAttributes((prev: SvgNodeAttributes) => ({
        ...prev,
        [attribute]: value || undefined,
      }));

      // Publish the update request
      await EventRouter.publish(
        "canvas.component.update.svg-node.requested",
        {
          id,
          path: selectedPath,
          attribute,
          value: value || null, // Send null to remove empty attributes
        },
        conductor
      );
    } catch {
      // Ignore publish errors; selection topic wiring covers sync
    }
  };

  if (!id || !selectedPath || !selectedNode) {
    return (
      <div
        className="svg-node-inspector"
        style={{
          fontFamily: "ui-sans-serif, system-ui",
          fontSize: 12,
          padding: 8,
          opacity: 0.7,
        }}
      >
        Select an SVG sub-node to customize its properties
      </div>
    );
  }

  const nodeType = getNodeTypeFromTag(selectedNode.tag);
  const attributes = getAttributesForNodeType(nodeType);

  return (
    <div
      className="svg-node-inspector"
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 12,
        padding: 8,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600 }}>
        SVG Node: {selectedNode.tag.toLowerCase()}
      </div>

      {attributes.map(({ key, label, type }) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <label style={{ display: "block", marginBottom: 2, fontSize: 11 }}>
            {label}
          </label>
          {type === "color" ? (
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="color"
                value={nodeAttributes[key] || "#000000"}
                onChange={(e) => handleAttributeChange(key, e.target.value)}
                style={{ width: 32, height: 24 }}
              />
              <input
                type="text"
                value={nodeAttributes[key] || ""}
                onChange={(e) => handleAttributeChange(key, e.target.value)}
                placeholder="e.g., #ff0000"
                style={{
                  flex: 1,
                  padding: "2px 4px",
                  fontSize: 11,
                  border: "1px solid #ccc",
                  borderRadius: 2,
                }}
              />
            </div>
          ) : (
            <input
              type={type === "number" ? "number" : "text"}
              value={nodeAttributes[key] || ""}
              onChange={(e) => handleAttributeChange(key, e.target.value)}
              placeholder={type === "number" ? "0" : ""}
              step={type === "number" && key === "opacity" ? "0.1" : "1"}
              min={type === "number" && key === "opacity" ? "0" : undefined}
              max={type === "number" && key === "opacity" ? "1" : undefined}
              style={{
                width: "100%",
                padding: "2px 4px",
                fontSize: 11,
                border: "1px solid #ccc",
                borderRadius: 2,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
