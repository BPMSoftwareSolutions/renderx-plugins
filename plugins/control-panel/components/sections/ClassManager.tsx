import React from "react";
import { CssEditorModal } from "../modals/CssEditorModal";
import { cssRegistry } from "../../state/css-registry.store";
import { setCssRegistryObserver } from "../../state/observer.store";

interface ClassManagerProps {
  classes: string[];
  onAdd: (className: string) => void;
  onRemove: (className: string) => void;
  onEdit?: (className: string, content: string) => void;
  onCreate?: (className: string, content: string) => void;
  onDeleteClass?: (className: string) => void;
}

export const ClassManager: React.FC<ClassManagerProps> = ({
  classes,
  onAdd,
  onRemove,
  onEdit,
  onCreate,
  onDeleteClass,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<string>("");
  const [editingContent, setEditingContent] = React.useState<string>("");
  const [_availableClasses, _setAvailableClasses] = React.useState<string[]>(
    []
  );

  // Load available CSS classes from registry
  React.useEffect(() => {
    const updateAvailableClasses = () => {
      _setAvailableClasses(cssRegistry.getClassNames());
    };

    updateAvailableClasses();

    // Set up observer for CSS registry changes
    setCssRegistryObserver(updateAvailableClasses);

    return () => {
      setCssRegistryObserver(null);
    };
  }, []);

  const handleSubmit = () => {
    if (inputRef.current?.value) {
      onAdd(inputRef.current.value);
      inputRef.current.value = "";
    }
  };

  const handleEditClass = (className: string) => {
    const classDefinition = cssRegistry.getClass(className);
    if (classDefinition) {
      setEditingClass(className);
      setEditingContent(classDefinition.content);
      setIsEditorOpen(true);
    } else {
      // Class doesn't exist in registry, create it with default content
      const defaultContent = `.${className} {
  /* Add your CSS properties here */
  display: block;
  position: relative;
}`;
      setEditingClass(className);
      setEditingContent(defaultContent);
      setIsEditorOpen(true);
    }
  };

  const handleCreateNewClass = () => {
    const className = inputRef.current?.value?.trim();
    if (!className) return;

    if (cssRegistry.hasClass(className)) {
      alert(
        `CSS class "${className}" already exists. Use the edit button to modify it.`
      );
      return;
    }

    const defaultContent = `.${className} {
  /* Add your CSS properties here */
  display: block;
  position: relative;
}`;

    setEditingClass(className);
    setEditingContent(defaultContent);
    setIsEditorOpen(true);
    inputRef.current.value = "";
  };

  const handleSaveClass = (content: string) => {
    if (cssRegistry.hasClass(editingClass)) {
      // Update existing class
      cssRegistry.updateClass(editingClass, content);
      onEdit?.(editingClass, content);
    } else {
      // Create new class
      cssRegistry.createClass(editingClass, content);
      onCreate?.(editingClass, content);
      // Don't add to component if it's already applied
      if (!classes.includes(editingClass)) {
        onAdd(editingClass);
      }
    }

    setIsEditorOpen(false);
    setEditingClass("");
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setIsEditorOpen(false);
    setEditingClass("");
    setEditingContent("");
  };

  const _handleDeleteClass = (className: string) => {
    const classDefinition = cssRegistry.getClass(className);
    if (classDefinition?.isBuiltIn) {
      alert(`Cannot delete built-in CSS class "${className}".`);
      return;
    }

    const confirmed = globalThis.confirm?.(
      `Are you sure you want to delete CSS class "${className}"? This will remove it from all components.`
    );

    if (confirmed) {
      cssRegistry.removeClass(className);
      onDeleteClass?.(className);
      // Also remove from current component if it's applied
      if (classes.includes(className)) {
        onRemove(className);
      }
    }
  };

  return (
    <>
      <div className="property-section">
        <div className="property-section-title">🎨 CSS Classes</div>
        <div className="property-grid">
          <div className="property-item">
            <label className="property-label">Current Classes</label>
            <div className="css-classes-container">
              {classes.map((className, index) => (
                <div key={index} className="css-class-item">
                  <span className="css-class-name">{className}</span>
                  <div className="css-class-actions">
                    <button
                      className="css-action-btn"
                      onClick={() => handleEditClass(className)}
                      title="Edit class"
                    >
                      ✏️
                    </button>
                    <button
                      className="css-action-btn remove"
                      onClick={() => onRemove(className)}
                      title="Remove from component"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="property-item">
            <label className="property-label">Add New Class</label>
            <div className="add-class-controls">
              <input
                ref={inputRef}
                className="property-input"
                type="text"
                placeholder="Enter class name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <button className="add-class-btn" onClick={handleSubmit}>
                Add
              </button>
              <button
                className="add-class-btn create-btn"
                onClick={handleCreateNewClass}
                title="Create new CSS class"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>

      <CssEditorModal
        isOpen={isEditorOpen}
        className={editingClass}
        cssContent={editingContent}
        onSave={handleSaveClass}
        onCancel={handleCancelEdit}
      />
    </>
  );
};
