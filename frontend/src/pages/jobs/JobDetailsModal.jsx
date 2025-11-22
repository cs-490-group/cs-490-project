import React, { useState } from "react";
import MaterialsModal from "./materials/MaterialsModal";

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

  // Check if materials are linked
  const hasMaterials = selectedJob.materials?.resume_id || selectedJob.materials?.cover_letter_id;

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

        {/* --- BASIC FIELDS --- */}
        <div style={{ marginBottom: "16px", color: "#000" }}>
          <strong>Company:</strong> {selectedJob.company}
        </div>

        {selectedJob.companyData && (
          <div style={{ marginBottom: "16px", background: "#f0f7ff", padding: "16px", borderRadius: "6px", border: "1px solid #d0e4ff" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#1976d2", fontSize: "16px" }}>🏢 Company Information</h3>

            {selectedJob.companyData.image && (
              <div style={{ marginBottom: "12px", textAlign: "center" }}>
                <img
                  src={
                    selectedJob.companyData.image.startsWith("http") 
                      ? selectedJob.companyData.image 
                      : `data:image/png;base64,${selectedJob.companyData.image}`
                  }
                  alt={`${selectedJob.company} logo`}
                  style={{ maxWidth: "150px", maxHeight: "80px", objectFit: "contain", borderRadius: "4px" }}
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

        {/* --- APPLICATION MATERIALS SECTION --- */}
        {selectedJob.materials && (
          <div style={{ marginBottom: "16px", background: "#f3e5f5", padding: "16px", borderRadius: "6px", border: "1px solid #e1bee7" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#7b1fa2", fontSize: "16px" }}>📄 Application Materials</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Resume Section */}
              <div style={{ padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                  📝 Resume
                </div>
                {selectedJob.materials.resume_id ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>Version:</strong> {selectedJob.materials.resume_version || 'N/A'}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>File:</strong> {selectedJob.materials.resume_name || 'Unnamed'}
                    </div>
                    {selectedJob.materials.linked_date && (
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                        Linked: {new Date(selectedJob.materials.linked_date).toLocaleDateString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
                    No resume linked
                  </div>
                )}
              </div>

              {/* Cover Letter Section */}
              <div style={{ padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                  ✉️ Cover Letter
                </div>
                {selectedJob.materials.cover_letter_id ? (
                  <>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>Version:</strong> {selectedJob.materials.cover_letter_version || 'N/A'}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                      <strong>File:</strong> {selectedJob.materials.cover_letter_name || 'Unnamed'}
                    </div>
                    {selectedJob.materials.linked_date && (
                      <div style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
                        Linked: {new Date(selectedJob.materials.linked_date).toLocaleDateString()}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
                    No cover letter linked
                  </div>
                )}
              </div>
            </div>

            {/* Materials History Section */}
            {selectedJob.materials_history && selectedJob.materials_history.length > 0 && (
              <div style={{ marginTop: "12px", padding: "12px", background: "white", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#333", marginBottom: "8px", cursor: "pointer" }}
                     onClick={() => {
                       const historyDiv = document.getElementById(`history-${selectedJob.id}`);
                       if (historyDiv) {
                         historyDiv.style.display = historyDiv.style.display === 'none' ? 'block' : 'none';
                       }
                     }}>
                  📜 Materials History ({selectedJob.materials_history.length}) 
                  <span style={{ fontSize: "11px", marginLeft: "8px", color: "#999" }}>▼ Click to expand</span>
                </div>
                <div id={`history-${selectedJob.id}`} style={{ display: 'none', marginTop: "8px" }}>
                  {selectedJob.materials_history.slice(-5).reverse().map((entry, idx) => (
                    <div key={idx} style={{ 
                      padding: "8px", 
                      borderLeft: "3px solid #9c27b0", 
                      marginBottom: "6px",
                      paddingLeft: "12px",
                      background: "#fafafa",
                      borderRadius: "4px"
                    }}>
                      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
                        {new Date(entry.date).toLocaleString()} - <strong style={{ color: "#7b1fa2" }}>{entry.action.toUpperCase()}</strong>
                      </div>
                      <div style={{ fontSize: "10px", color: "#999" }}>
                        Resume: {entry.resume_version || 'None'} | Cover Letter: {entry.cover_letter_version || 'None'}
                      </div>
                    </div>
                  ))}
                  {selectedJob.materials_history.length > 5 && (
                    <div style={{ fontSize: "11px", color: "#999", marginTop: "8px", textAlign: "center" }}>
                      Showing latest 5 of {selectedJob.materials_history.length} entries
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

                {/* --- STATUS HISTORY SECTION --- */}
        {selectedJob.status_history && selectedJob.status_history.length > 0 && (
          <div style={{ marginBottom: "16px", background: "#e8f5e9", padding: "16px", borderRadius: "6px", border: "1px solid #c8e6c9" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#2e7d32", fontSize: "16px" }}>📋 Status History</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...selectedJob.status_history].reverse().map((entry, idx) => (
                <div key={idx} style={{ 
                  padding: "10px 12px", 
                  background: "white", 
                  borderRadius: "4px",
                  borderLeft: "3px solid #4caf50",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#333" }}>
                      {entry[0]}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(entry[1]).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
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

          {/* --- MATERIALS --- */}
          <button
            onClick={() => {
              setMaterialsOpen(true);
            }}
            style={{
              padding: "10px 20px",
              background: hasMaterials ? "#7b1fa2" : "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              position: "relative"
            }}
          >
            {hasMaterials ? "✓ " : ""}
            📦 {hasMaterials ? "Update Materials" : "Set Materials"}
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
          <MaterialsModal 
            job={selectedJob} 
            onClose={() => setMaterialsOpen(false)}
            onSave={async (updatedJob) => {
              console.log('📦 Saving materials from modal:', updatedJob.materials);
              
              // Update the job with the new materials
              await updateJob(updatedJob);
              
              // Update selectedJob state to show changes immediately
              setSelectedJob(prev => ({
                ...prev,
                materials: updatedJob.materials,
                materials_history: updatedJob.materials_history
              }));
              
              // Close the modal
              setMaterialsOpen(false);
              
              console.log('✅ Materials modal closed, job updated');
            }}
          />
        )}

      </div>
    </div>
  );
}