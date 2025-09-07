import React from "react";
import { createPortal } from "react-dom";
import "./CssEditorModal.css"; // reuse styles

export interface CodeEditorModalProps {
  isOpen: boolean;
  className?: string;
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  isOpen,
  className = "",
  content,
  onSave,
  onCancel,
}) => {
  const [local, setLocal] = React.useState(content);
  const [hasChanges, setHasChanges] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocal(content);
    setHasChanges(false);
  }, [content, isOpen]);

  React.useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const modalContent = (
    <div className={`modal-overlay ${isOpen ? "open" : ""}`}>
      <div className={`modal ${className}`}>
        <div className="modal-header">
          <h3>Full-screen Editor</h3>
          <div className="modal-actions">
            <button onClick={() => onCancel()}>Close</button>
            <button
              className="primary"
              disabled={!hasChanges}
              onClick={() => onSave(local)}
              title={hasChanges ? "Apply changes" : "No changes to apply"}
            >
              Apply
            </button>
          </div>
        </div>
        <div className="modal-content">
          <textarea
            ref={textareaRef}
            className="css-editor-textarea"
            value={local}
            onChange={(e) => {
              setLocal(e.target.value);
              setHasChanges(true);
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );

  return isOpen
    ? createPortal(modalContent, (globalThis as any).document?.body || null)
    : null;
};
