import React from "react";
import { createPortal } from "react-dom";
import "./CssEditorModal.css";

export interface CssEditorModalProps {
  isOpen: boolean;
  className: string;
  cssContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const CssEditorModal: React.FC<CssEditorModalProps> = ({
  isOpen,
  className,
  cssContent,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = React.useState(cssContent);
  const [hasChanges, setHasChanges] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Update content when props change
  React.useEffect(() => {
    setContent(cssContent);
    setHasChanges(false);
  }, [cssContent, isOpen]);

  // Focus textarea when modal opens
  React.useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasChanges(newContent !== cssContent);
  };

  const handleSave = () => {
    onSave(content);
    setHasChanges(false);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = globalThis.confirm?.(
        "You have unsaved changes. Are you sure you want to cancel?"
      );
      if (!confirmed) return;
    }
    setContent(cssContent);
    setHasChanges(false);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+S to save
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    // Handle Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
    // Handle Tab for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);
      setHasChanges(true);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const generateLineNumbers = () => {
    const lines = content.split("\n");
    return lines.map((_, index) => (
      <div key={index + 1} className="line-number">
        {index + 1}
      </div>
    ));
  };

  if (!isOpen) return null;

  // Render modal in a portal to escape the Control Panel container
  return createPortal(
    <div className="css-editor-modal-overlay" onClick={handleCancel}>
      <div className="css-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="css-editor-header">
          <div className="css-editor-title">
            <span className="css-editor-icon">✏️</span>
            Edit CSS Class
          </div>
          <button
            className="css-editor-close"
            onClick={handleCancel}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>

        <div className="css-editor-class-name">
          <span className="css-class-selector">.{className}</span>
        </div>

        <div className="css-editor-content">
          <div className="css-editor-container">
            <div className="line-numbers">{generateLineNumbers()}</div>
            <textarea
              ref={textareaRef}
              className="css-editor-textarea"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="/* Add your CSS properties here */"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>

        <div className="css-editor-footer">
          <div className="css-editor-info">
            <span className="css-editor-hint">
              💡 Use Ctrl+S to save, Esc to cancel
            </span>
            {hasChanges && (
              <span className="css-editor-changes">• Unsaved changes</span>
            )}
          </div>
          <div className="css-editor-actions">
            <button
              className="css-editor-btn css-editor-btn-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="css-editor-btn css-editor-btn-save"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>,
    (globalThis as any).document?.body || null
  );
};
