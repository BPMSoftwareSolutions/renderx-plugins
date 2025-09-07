import React from "react";
import { useConductor } from "@renderx/host-sdk";
import { onDropForTest } from "./CanvasDrop";
import { CanvasHeader } from "./CanvasHeader";
import "./CanvasPage.css";

export function CanvasPage() {
  const conductor = useConductor();

  const onDrop = (e: React.DragEvent) => {
    onDropForTest(e, conductor);
  };

  return (
    <div className="canvas-area">
      <CanvasHeader />
      <div
        className="canvas-content"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="canvas-grid"></div>
        <div className="drop-indicator"></div>
        {/* StageCrew renders actual DOM inside #rx-canvas; UI stays dumb */}
        <div id="rx-canvas" style={{ position: "absolute", inset: 0 }} />
      </div>
    </div>
  );
}
