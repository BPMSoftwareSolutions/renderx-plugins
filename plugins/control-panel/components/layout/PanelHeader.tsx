import React from 'react';
import type { SelectedElement } from '../../types/control-panel.types';

export const PanelHeader = ({ selectedElement }: { selectedElement: SelectedElement | null }) => (
  <div className="control-panel-header">
    <h3>⚙️ Properties Panel</h3>
    {selectedElement && (
      <div className="element-info">
        <span className="element-type">{selectedElement.header.type}</span>
        <span className="element-id">#{selectedElement.header.id}</span>
      </div>
    )}
  </div>
);
