"use client";
import { useEffect, useRef, useState } from "react";

// Small inline WYSIWYG editor for product/page descriptions.
// Uses contentEditable + execCommand. Stores HTML; sanitization happens
// server-side on save. Toolbar covers the essentials admins actually need:
// bold/italic/underline, two heading levels, bullet/numbered lists, link,
// paragraph reset, and clear formatting.

function ToolbarButton({ onClick, title, children, active }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent focus loss from the editable area so the selection stays put.
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
        active
          ? "bg-[#1a2b4a] text-white border-[#1a2b4a]"
          : "bg-white text-gray-700 border-gray-300 hover:border-[#1a2b4a]"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichText({ value, onChange, placeholder = "Write the description here…" }) {
  const ref = useRef(null);
  const [, force] = useState(0);

  // Sync external value into the contentEditable on mount and when it
  // changes externally (e.g. when editing a different product).
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  function exec(command, arg) {
    if (typeof document === "undefined") return;
    document.execCommand(command, false, arg);
    ref.current?.focus();
    onChange?.(ref.current?.innerHTML || "");
    force((n) => n + 1);
  }

  function makeLink() {
    const url = prompt("Link URL (https://…):");
    if (!url) return;
    exec("createLink", url);
  }

  function handleInput() {
    onChange?.(ref.current?.innerHTML || "");
  }

  // Paste as plain text — keeps the formatting our toolbar produced and
  // strips inline styles users would otherwise copy from elsewhere.
  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <div className="flex flex-wrap gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <ToolbarButton title="Bold (Ctrl+B)" onClick={() => exec("bold")}><b>B</b></ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" onClick={() => exec("italic")}><i>I</i></ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" onClick={() => exec("underline")}><u>U</u></ToolbarButton>
        <span className="w-px bg-gray-300 mx-0.5" />
        <ToolbarButton title="Large heading" onClick={() => exec("formatBlock", "<h2>")}>H1</ToolbarButton>
        <ToolbarButton title="Small heading" onClick={() => exec("formatBlock", "<h3>")}>H2</ToolbarButton>
        <ToolbarButton title="Paragraph" onClick={() => exec("formatBlock", "<p>")}>¶</ToolbarButton>
        <span className="w-px bg-gray-300 mx-0.5" />
        <ToolbarButton title="Bullet list" onClick={() => exec("insertUnorderedList")}>• List</ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec("insertOrderedList")}>1. List</ToolbarButton>
        <span className="w-px bg-gray-300 mx-0.5" />
        <ToolbarButton title="Insert link" onClick={makeLink}>🔗</ToolbarButton>
        <ToolbarButton title="Remove link" onClick={() => exec("unlink")}>✕🔗</ToolbarButton>
        <span className="w-px bg-gray-300 mx-0.5" />
        <ToolbarButton title="Clear formatting" onClick={() => exec("removeFormat")}>Clear</ToolbarButton>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="rt-editor min-h-[180px] max-h-[460px] overflow-auto px-3 py-2.5 text-sm focus:outline-none"
      />
      <style jsx global>{`
        .rt-editor:empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rt-editor h2 { font-size: 1.3rem; font-weight: 700; margin: 0.75rem 0 0.5rem; line-height: 1.25; }
        .rt-editor h3 { font-size: 1.05rem; font-weight: 600; margin: 0.65rem 0 0.4rem; line-height: 1.3; }
        .rt-editor p { margin: 0.4rem 0; }
        .rt-editor ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rt-editor ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rt-editor a { color: #1a35d4; text-decoration: underline; }
        .rt-editor strong, .rt-editor b { font-weight: 700; }
      `}</style>
    </div>
  );
}
