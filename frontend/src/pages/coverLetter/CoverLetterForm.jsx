import { useState, useEffect, useRef } from "react";

export default function CoverLetterForm({ editEntry, onAdded, cancelEdit }) {
  const [title, setTitle] = useState(editEntry?.title || "");
  const [company, setCompany] = useState(editEntry?.company || "");
  const [position, setPosition] = useState(editEntry?.position || "");
  const [content, setContent] = useState(editEntry?.content || "");
  const iframeRef = useRef(null);

  // Update state when editEntry changes
  useEffect(() => {
    setTitle(editEntry?.title || "");
    setCompany(editEntry?.company || "");
    setPosition(editEntry?.position || "");
    setContent(editEntry?.content || "");
  }, [editEntry]);

  // Initialize iframe only when editEntry/content changes externally
  useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;

    // Write full HTML including <head> if it exists
    doc.open();
    if (content.includes("<html")) {
      doc.write(content);
    } else {
      doc.write(`<html><head></head><body>${content || ""}</body></html>`);
    }
    doc.close();

    doc.body.contentEditable = "true";
    doc.body.style.padding = "20px";
    doc.body.style.minHeight = "500px";

    const handleInput = () => {
      // Save the **entire document**, not just body.innerHTML
      setContent(doc.documentElement.outerHTML);
    };

    doc.body.addEventListener("input", handleInput);

    return () => {
      doc.body.removeEventListener("input", handleInput);
    };
  }, [editEntry]);

  const handleSave = () => {
    onAdded({ ...editEntry, title, company, position, content });
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <input
        type="text"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        placeholder="Position"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <iframe
        ref={iframeRef}
        style={{
          width: "100%",
          minHeight: "500px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          marginBottom: "10px",
        }}
      />

      <button
        onClick={handleSave}
        style={{
          marginRight: "10px",
          padding: "8px 16px",
          background: "#34c759",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Save
      </button>
      <button
        onClick={cancelEdit}
        style={{
          padding: "8px 16px",
          background: "#ff3b30",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
