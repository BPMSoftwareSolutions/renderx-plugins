import React from "react";
import "./Header.css";

export function HeaderControls() {
  return (
    <div className="header-container">
      <div className="header-controls">
        <button className="header-button" title="New">
          New
        </button>
        <button className="header-button" title="Open">
          Open
        </button>
        <button className="header-button" title="Save">
          Save
        </button>
      </div>
    </div>
  );
}
