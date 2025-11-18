import React, { useState } from "react";
import { MaterialsModal } from "./MaterialsTracking";

export default function JobDetailsModal({
  selectedJob,
  setSelectedJob,
  setReminderJob,
  setMaterialsJob,
  updateJob,
  archiveJob,
  restoreJob,
  deleteJob,
  setEditingJob,
  setView
}) {
  const [materialsOpen, setMaterialsOpen] = useState(false);

  if (!selectedJob) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1040,
        padding: "20px",
      }}
      onClick={() => setSelectedJob(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "24px",
        }}
      >

        {/* --- HEADER --- */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#333" }}>{selectedJob.title}</h2>
          <button
            onClick={() => setSelectedJob(null)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666"
            }}
          >
            ×
          </button>
        </div>

        {/* --- BASIC FIELDS (same as before) --- */}
        <div style={{ marginBottom: "16px", color: "#000" }}>
          <strong>Company:</strong> {selectedJob.company}
        </div>

        {selectedJob.companyData && (
          <div style={{ marginBottom: "16px", background: "#f0f7ff", padding: "16px", borderRadius: "6px", border: "1px solid #d0e4ff" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "16px" }}>🏢 Company Information</h3>

            {selectedJob.companyData.image && (
              <div style={{ marginBottom: "12px", textAlign: "center" }}>
                <img
                  src={`data:image/png;base64,${selectedJob.companyData.image}`}
                  alt={`${selectedJob.company} logo`}
                  style={{ maxWidth: "150px", maxHeight: "80px", objectFit: "contain", borderRadius: "4px" }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {selectedJob.companyData.size && (
              <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
                <strong>👥 Company Size:</strong> {selectedJob.companyData.size}
              </div>
            )}

            {selectedJob.companyData.industry && (
              <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
                <strong>🏭 Industry:</strong> {selectedJob.companyData.industry}
              </div>
            )}

            {selectedJob.companyData.location && (
              <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
                <strong>📍 Headquarters:</strong> {selectedJob.companyData.location}
              </div>
            )}

            {selectedJob.companyData.website && (
              <div style={{ marginBottom: "8px", color: "#000", fontSize: "14px" }}>
                <strong>🌐 Website:</strong>{" "}
                <a
                  href={selectedJob.companyData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4f8ef7", textDecoration: "underline" }}
                >
                  {selectedJob.companyData.website}
                </a>
              </div>
            )}

            {selectedJob.companyData.description && (
              <div style={{ marginTop: "12px", color: "#000", fontSize: "14px" }}>
                <strong>About:</strong>
                <div style={{ marginTop: "6px", color: "#555", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                  {selectedJob.companyData.description}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- BASIC JOB DETAILS --- */}
        {selectedJob.location && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Location:</strong> {selectedJob.location}
          </div>
        )}

        {selectedJob.salary && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Salary:</strong> {selectedJob.salary}
          </div>
        )}

        {selectedJob.deadline && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Deadline:</strong> {new Date(selectedJob.deadline).toLocaleDateString()}

            <button
              onClick={() => setReminderJob(selectedJob)}
              style={{
                marginLeft: "12px",
                padding: "6px 12px",
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              ⏰ Set Reminder
            </button>

            <button
              onClick={() => {
                const newDeadline = prompt("Enter new deadline (YYYY-MM-DD):", selectedJob.deadline);
                if (newDeadline) {
                  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                  if (dateRegex.test(newDeadline)) {
                    updateJob({ ...selectedJob, deadline: newDeadline });
                  } else {
                    alert("Invalid date format. Please use YYYY-MM-DD");
                  }
                }
              }}
              style={{
                marginLeft: "8px",
                padding: "6px 12px",
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              📅 Extend Deadline
            </button>
          </div>
        )}

        {selectedJob.url && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Link:</strong>{" "}
            <a
              href={selectedJob.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4f8ef7", textDecoration: "underline" }}
            >
              View Job Posting →
            </a>
          </div>
        )}

        {selectedJob.description && (
          <div style={{ marginBottom: "16px", color: "#000" }}>
            <strong>Description:</strong>
            <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", marginTop: "8px", whiteSpace: "pre-wrap" }}>
              {selectedJob.description}
            </div>
          </div>
        )}

        {selectedJob.notes && (
          <div style={{ marginBottom: "16px", background: "#fffbea", padding: "12px", borderRadius: "4px", color: "#000" }}>
            <strong>Notes:</strong>
            <div style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{selectedJob.notes}</div>
          </div>
        )}

        {/* --- BUTTON ROW --- */}
        <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>

          {/* --- EDIT JOB FIRST --- */}
          <button
            onClick={() => {
              setEditingJob(selectedJob);
              setView("form");
              setSelectedJob(null);
            }}
            style={{
              padding: "10px 20px",
              background: "#34c759",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            ✏️ Edit Job
          </button>

          {/* --- MATERIALS BUTTON NOW DIRECTLY AFTER EDIT JOB --- */}
          <button
            onClick={() => {
              setMaterialsJob(selectedJob);
              setMaterialsOpen(true);
            }}
            style={{
              padding: "10px 20px",
              background: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            📦 Set Materials
          </button>

          {/* --- ARCHIVE / RESTORE --- */}
          {selectedJob.archived ? (
            <button
              onClick={() => {
                restoreJob(selectedJob.id);
                setSelectedJob(null);
              }}
              style={{
                padding: "10px 20px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              ♻️ Restore Job
            </button>
          ) : (
            <button
              onClick={() => {
                const reason = prompt("Reason for archiving (optional):");
                if (reason !== null) {
                  archiveJob(selectedJob.id, reason);
                }
              }}
              style={{
                padding: "10px 20px",
                background: "#607d8b",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              🗄️ Archive Job
            </button>
          )}

          {/* --- DELETE --- */}
          <button
            onClick={() => {
              deleteJob(selectedJob.id);
            }}
            style={{
              padding: "10px 20px",
              background: "#ff3b30",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            🗑️ Delete Job
          </button>
        </div>

        {/* --- MATERIALS MODAL --- */}
        {materialsOpen && (
          <MaterialsModal job={selectedJob} onClose={() => setMaterialsOpen(false)} />
        )}

      </div>
    </div>
  );
}
