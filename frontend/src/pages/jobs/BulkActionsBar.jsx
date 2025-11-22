import React from "react";

export default function BulkActionsBar({
  view,
  selectedJobIds,
  bulkSetDeadline,
  bulkArchive,
  bulkDelete,
  clearSelection
}) {
  if (view !== "pipeline" || selectedJobIds.length === 0) return null;

  return (
    <div style={{
      background: "#4f8ef7",
      color: "white",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "10px"
    }}>
      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
        {selectedJobIds.length} job(s) selected
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={bulkSetDeadline}
          style={{
            padding: "8px 16px",
            background: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          📅 Set Deadline
        </button>
        <button
          onClick={bulkArchive}
          style={{
            padding: "8px 16px",
            background: "#607d8b",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          🗄️ Archive Selected
        </button>
        <button
          onClick={bulkDelete}
          style={{
            padding: "8px 16px",
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          🗑️ Delete Selected
        </button>
        <button
          onClick={clearSelection}
          style={{
            padding: "8px 16px",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "1px solid white",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}