import React from "react";
import type { FieldRendererProps } from "../../types/control-panel.types";
import { useControlPanelSequences } from "../../hooks/useControlPanelSequences";
import { CodeEditorModal } from "../modals/CodeEditorModal";

export const CodeTextarea: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  onValidate,
  disabled = false,
  className = "",
  selectedElement = null,
}) => {
  const sequences = useControlPanelSequences();
  const [localValue, setLocalValue] = React.useState<string>(value || "");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [showExtract, setShowExtract] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const rows = field.rendererProps?.rows ?? 8;
  const placeholder = field.rendererProps?.placeholder ?? "Paste SVG markup…";

  React.useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  function validateAndReport(next: string) {
    const errs: string[] = [];
    if (field.required && !next.trim()) errs.push(`${field.label} is required`);
    setErrors(errs);
    onValidate?.(errs.length === 0, errs);
  }

  function detectExtractCandidate(text: string) {
    const hasSvgRoot = /^\s*<svg[\s>]/i.test(text || "");
    setShowExtract(hasSvgRoot);
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    validateAndReport(next);
    detectExtractCandidate(next);
    onChange(next);
  };

  function prettyPrintXml(xml: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<root>${xml}</root>`,
        "application/xml"
      );
      const err = doc.querySelector("parsererror");
      if (err) throw new Error(err.textContent || "XML parse error");
      const serializer = new XMLSerializer();
      const raw = serializer.serializeToString(doc.documentElement);
      // Remove outer wrapper and add simple indentation
      const inner = raw.replace(/^<root>|<\/root>$/g, "");
      const tokens = inner
        .replace(/>\s+</g, "><")
        .replace(/></g, ">\n<")
        .split("\n");
      let indent = 0;
      return tokens
        .map((t) => {
          if (/^<\//.test(t)) indent = Math.max(0, indent - 1);
          const line = `${"  ".repeat(indent)}${t}`;
          if (/^<[^!?][^>]*[^/]>$/.test(t)) indent += 1; // opening tag
          return line;
        })
        .join("\n");
    } catch (e: any) {
      setErrors([e?.message || "Failed to format XML"]);
      onValidate?.(false, [e?.message || "Failed to format XML"]);
      return xml;
    }
  }

  function handleFormat() {
    const formatted = prettyPrintXml(localValue);
    setLocalValue(formatted);
    onChange(formatted);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setLocalValue(text);
    detectExtractCandidate(text);
    onChange(text);
  }

  function extractFromFullSvg(text: string) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) throw new Error("No <svg> root found");
      const viewBox = svg.getAttribute("viewBox") || undefined;
      const par = svg.getAttribute("preserveAspectRatio") || undefined;
      // Prefer innerHTML from the parsed SVG document to avoid touching global DOM
      const inner =
        (svg as unknown as { innerHTML?: string }).innerHTML ??
        new XMLSerializer()
          .serializeToString(svg)
          .replace(/^<svg[^>]*>/i, "")
          .replace(/<\/svg>$/i, "");

      // Dispatch updates via sequences for multi-field changes
      if (sequences.isInitialized && selectedElement) {
        sequences.handleFieldChange("svgMarkup", inner, selectedElement);
        if (viewBox)
          sequences.handleFieldChange("viewBox", viewBox, selectedElement);
        if (par)
          sequences.handleFieldChange(
            "preserveAspectRatio",
            par,
            selectedElement
          );
      } else {
        // Fallback to onChange for content
        onChange(inner);
      }

      setLocalValue(inner);
      setShowExtract(false);
      validateAndReport(inner);
    } catch (e: any) {
      setErrors([e?.message || "Failed to extract from <svg>"]);
      onValidate?.(false, [e?.message || "Failed to extract from <svg>"]);
    }
  }

  return (
    <div className={`field-input code-textarea ${className}`}>
      <div className="code-toolbar">
        <button
          className="action-btn"
          type="button"
          onClick={handleImportClick}
          disabled={disabled}
          title="Import SVG file"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
        <button
          className="action-btn"
          type="button"
          onClick={handleFormat}
          disabled={disabled}
          title="Format XML"
        >
          Format
        </button>
        <button
          className="action-btn"
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          title="Full-screen editor"
        >
          Full‑screen
        </button>
      </div>

      {showExtract && (
        <div
          className="extract-prompt"
          style={{ marginBottom: 6, fontSize: 12 }}
        >
          Detected full <code>&lt;svg&gt;</code> markup. Extract inner markup
          and apply attributes?
          <div style={{ display: "inline-flex", gap: 8, marginLeft: 8 }}>
            <button
              type="button"
              onClick={() => extractFromFullSvg(localValue)}
            >
              Apply
            </button>
            <button type="button" onClick={() => setShowExtract(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <textarea
        className="property-input"
        rows={rows}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        spellCheck={false}
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        }}
        title={field.description}
      />

      {errors.length > 0 && (
        <div className="field-errors">
          {errors.map((err, i) => (
            <div key={i} className="field-error">
              {err}
            </div>
          ))}
        </div>
      )}

      <CodeEditorModal
        isOpen={isModalOpen}
        className="code-editor-modal"
        content={localValue}
        onSave={(content) => {
          setIsModalOpen(false);
          setLocalValue(content);
          validateAndReport(content);
          onChange(content);
        }}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};
