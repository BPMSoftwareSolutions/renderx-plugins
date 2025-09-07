import React from "react";
import { useControlPanelState } from "../hooks/useControlPanelState";
import { useSchemaResolver } from "../hooks/useSchemaResolver";
import { useControlPanelActions } from "../hooks/useControlPanelActions";
import { useControlPanelSequences } from "../hooks/useControlPanelSequences";
import { PanelHeader } from "../components/layout/PanelHeader";
import { EmptyState } from "../components/layout/EmptyState";
import { LoadingState } from "../components/layout/LoadingState";
import { PropertySection } from "../components/sections/PropertySection";
import { ClassManager } from "../components/sections/ClassManager";
import "./ControlPanel.css";

export function ControlPanel() {
  const { state, dispatch } = useControlPanelState();
  const { resolver, isLoading } = useSchemaResolver();
  const sequences = useControlPanelSequences();
  const {
    handleAttributeChange,
    handleAddClass,
    handleRemoveClass,
    handleCreateCssClass,
    handleEditCssClass,
    handleDeleteCssClass,
    toggleSection
  } = useControlPanelActions(state.selectedElement, dispatch);

  // Trigger render sequence when selected element changes
  React.useEffect(() => {
    if (sequences.isInitialized) {
      sequences.triggerRender(state.selectedElement);
    }
  }, [sequences, state.selectedElement]);

  // Generate dynamic fields and sections
  const { fields, sections } = React.useMemo(() => {
    if (!resolver || !state.selectedElement) {
      return { fields: [], sections: [] };
    }

    const generatedFields = resolver.generatePropertyFields(state.selectedElement);
    const generatedSections = resolver.generateSections(state.selectedElement.header.type);

    return { fields: generatedFields, sections: generatedSections };
  }, [resolver, state.selectedElement]);

  const handleFieldValidation = (fieldKey: string, isValid: boolean, errors: string[]) => {
    const newErrors = { ...state.validationErrors };
    if (isValid) {
      delete newErrors[fieldKey];
    } else {
      newErrors[fieldKey] = errors;
    }
    dispatch({ type: 'SET_VALIDATION_ERRORS', payload: newErrors });
  };

  if (isLoading) {
    return (
      <div className="control-panel">
        <PanelHeader selectedElement={null} />
        <div className="control-panel-content">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="control-panel">
      <PanelHeader selectedElement={state.selectedElement} />
      <div className="control-panel-content">
        {!state.selectedElement ? (
          <EmptyState />
        ) : (
          <div className="property-sections">
            {sections.map(section => (
              <PropertySection
                key={section.id}
                section={section}
                fields={fields}
                selectedElement={state.selectedElement!}
                isExpanded={state.expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                onChange={handleAttributeChange}
                onValidate={handleFieldValidation}
              />
            ))}
            <ClassManager
              classes={state.currentClasses}
              onAdd={handleAddClass}
              onRemove={handleRemoveClass}
              onEdit={handleEditCssClass}
              onCreate={handleCreateCssClass}
              onDeleteClass={handleDeleteCssClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}
