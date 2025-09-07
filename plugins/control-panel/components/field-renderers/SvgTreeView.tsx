import React from "react";
import type { FieldRendererProps } from "../../types/control-panel.types";
import { useConductor, EventRouter } from "@renderx/host-sdk";

type TreeNodeModel = {
  tag: string;
  id?: string;
  attrs?: Record<string, string>;
  children: TreeNodeModel[];
};

function parseSvgToTree(svgMarkup: string): TreeNodeModel | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<svg>${svgMarkup}</svg>`,
      "image/svg+xml"
    );
    const svg = doc.querySelector("svg");
    if (!svg) return null;
    const walk = (el: Element): TreeNodeModel => {
      const attrs: Record<string, string> = {};
      try {
        for (const a of Array.from(el.attributes || [])) {
          attrs[a.name] = a.value;
        }
      } catch {}
      return {
        tag: el.tagName,
        id: (el as HTMLElement).id || undefined,
        attrs,
        children: Array.from(el.children).map(walk),
      };
    };
    return walk(svg);
  } catch {
    return null;
  }
}

function TreeNode({
  node,
  path,
  onSelect,
  selectedPath,
}: {
  node: TreeNodeModel;
  path: string;
  onSelect: (path: string) => void;
  selectedPath: string;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const label = React.useMemo(() => {
    const attrs = (node.attrs || {}) as Record<string, string>;

    // Start with a curated, compact set
    const primaryKeys = ["font-family", "font-weight"];
    const parts: string[] = [];
    const included = new Set<string>();

    for (const k of primaryKeys) {
      const v = attrs[k];
      if (typeof v === "string" && v.length) {
        parts.push(`${k}="${v}"`);
        included.add(k);
      }
    }

    // Ensure we show at least 15 chars of detail beyond the tag
    const minExtra = 15;
    const currentLen = parts.join(" ").length;
    if (currentLen < minExtra) {
      const fallbackKeys = [
        "id",
        "class",
        "d", // path data is informative; trim to keep small
        "fill",
        "stroke",
        "font-size",
        "x",
        "y",
        "width",
        "height",
        "points",
      ];
      for (const k of fallbackKeys) {
        if (included.has(k)) continue;
        const v0 = attrs[k];
        if (typeof v0 !== "string" || !v0.length) continue;
        let v = v0;
        if (k === "d" && v.length > 30) v = v.slice(0, 30) + "…";
        parts.push(`${k}="${v}` + `"`);
        included.add(k);
        if (parts.join(" ").length >= minExtra) break;
      }
    }

    const attrStr = parts.length ? ` ${parts.join(" ")}` : "";
    return `<${node.tag}${attrStr}>`;
  }, [node]);
  const hasChildren = (node.children || []).length > 0;
  return (
    <div style={{ marginLeft: 8, pointerEvents: "auto" }}>
      <div
        style={{
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background:
            selectedPath === path || (!path && selectedPath === "")
              ? "var(--control-hover-bg)"
              : undefined,
          borderRadius:
            selectedPath === path || (!path && selectedPath === "")
              ? 4
              : undefined,
        }}
        title="Click to highlight on canvas; click triangle to toggle"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((e) => !e)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpanded((x) => !x);
          }}
          style={{ width: 12, display: "inline-block" }}
        >
          {hasChildren ? (expanded ? "▾" : "▸") : "•"}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={() => onSelect(path)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect(path);
          }}
        >
          {label}
        </span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child: TreeNodeModel, idx: number) => (
            <TreeNode
              key={idx}
              node={child}
              path={path ? `${path}/${idx}` : `${idx}`}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const SvgTreeView: React.FC<FieldRendererProps> = ({
  selectedElement,
}) => {
  const conductor = useConductor();
  const svgMarkup = selectedElement?.content?.svgMarkup || "";
  const id = selectedElement?.header?.id;
  const root = React.useMemo(() => parseSvgToTree(svgMarkup), [svgMarkup]);
  const [selectedPath, setSelectedPath] = React.useState<string>("");

  // Sync selection when canvas confirms the sub-node selection
  React.useEffect(() => {
    const unsub = EventRouter.subscribe(
      "canvas.component.select.svg-node.changed",
      (p: any) => {
        try {
          const targetId = String(p?.id || "");
          if (!targetId || targetId !== String(id || "")) return;
          setSelectedPath(String(p?.path || ""));
        } catch {}
      }
    );
    return () => unsub?.();
  }, [id]);

  const handleSelect = async (path: string) => {
    const cleanPath = String(path || "").replace(/^\//, "");
    setSelectedPath(cleanPath);
    if (!id || !conductor?.play) return;
    try {
      await EventRouter.publish(
        "canvas.component.select.svg-node.requested",
        { id, path: cleanPath },
        conductor
      );
    } catch {
      // Silently ignore selection publish failures
    }
  };

  if (!id) return null;

  return (
    <div
      className="svg-tree-view"
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        fontSize: 12,
        pointerEvents: "auto",
      }}
    >
      {!root ? (
        <div style={{ opacity: 0.7 }}>No child nodes</div>
      ) : (
        <TreeNode
          node={root}
          path=""
          onSelect={handleSelect}
          selectedPath={selectedPath}
        />
      )}
    </div>
  );
};
