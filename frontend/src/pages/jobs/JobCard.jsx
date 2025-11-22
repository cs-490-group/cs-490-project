import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString();
};

export default function JobCard({ job, onView, onEdit, onDelete, onArchive, onRestore, isOverlay, onSelect, isSelected }) {
  const [expanded, setExpanded] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: job.id,
    disabled: isOverlay
  });

  const style = isOverlay ? {} : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lastStatusChange = job.statusHistory?.[job.statusHistory.length - 1]?.timestamp || job.createdAt;
  const daysInStage = Math.floor((new Date() - new Date(lastStatusChange)) / (1000 * 60 * 60 * 24));

  const deadlineDate = job.deadline ? parseLocalDate(job.deadline) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilDeadline = deadlineDate ? Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24)) : null;
  const deadlineWarning = daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  const deadlinePassed = daysUntilDeadline !== null && daysUntilDeadline < 0;

  const cardStyle = {
    background: deadlinePassed ? "#ffebee" : deadlineWarning ? "#fff3cd" : "white",
    padding: "12px",
    borderRadius: "6px",
    border: isSelected ? "2px solid #4f8ef7" : isDragging ? "2px solid #4f8ef7" : "1px solid #ddd",
    boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    boxSizing: "border-box",
    marginBottom: "8px",
    cursor: "grab",
    opacity: job.archived ? 0.6 : 1,
  };

  const buttonStyle = {
    padding: "4px 8px",
    fontSize: "11px",
    cursor: "pointer",
    border: "none",
    borderRadius: "4px",
    fontWeight: "600",
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "start", gap: "8px" }}>
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(job.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ marginTop: "4px", cursor: "pointer", width: "16px", height: "16px" }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px", color: "#333" }}>
                {job.title}
                {job.archived && <span style={{ marginLeft: "8px", fontSize: "12px", color: "#999" }}>📦 Archived</span>}
              </div>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                {job.company}
              </div>
            </div>
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setExpanded(!expanded); 
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ 
              ...buttonStyle,
              background: expanded ? "#ff9800" : "#4f8ef7",
              color: "white",
              marginLeft: "8px",
              flexShrink: 0
            }}
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
        

        <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
          {daysInStage === 0 ? "Added today" : `${daysInStage} day${daysInStage !== 1 ? "s" : ""} in stage`}
        </div>
        
        {job.deadline && (
          <div style={{ 
            fontSize: "12px", 
            marginBottom: "4px",
            color: deadlinePassed ? "#d32f2f" : deadlineWarning ? "#f57c00" : "#666",
            fontWeight: (deadlineWarning || deadlinePassed) ? "bold" : "normal"
          }}>
            ⏰ {deadlinePassed ? "EXPIRED: " : deadlineWarning ? "URGENT: " : ""}
            {formatDate(job.deadline)}
          </div>
        )}
        {job.materials && (job.materials.resume_id || job.materials.cover_letter_id) && (
          <div style={{ fontSize: "11px", color: "#7b1fa2", marginTop: "2px", fontWeight: "600" }}>
            📦 {job.materials.resume_id ? '📝' : ''} {job.materials.cover_letter_id ? '✉️' : ''} Materials Attached
          </div>
        )}        
        {job.location && (
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            📍 {job.location}
          </div>
        )}
        
        {job.archived && job.archiveDate && (
          <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px", fontStyle: "italic" }}>
            🗄️ Archived: {formatDate(job.archiveDate.split('T')[0])}
          </div>
        )}

        {expanded && (
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee", color: "#000" }}>
            {job.salary && <p style={{ margin: "4px 0", fontSize: "13px" }}><strong>Salary:</strong> {job.salary}</p>}
            {job.industry && <p style={{ margin: "4px 0", fontSize: "13px" }}><strong>Industry:</strong> {job.industry}</p>}
            {job.jobType && <p style={{ margin: "4px 0", fontSize: "13px" }}><strong>Type:</strong> {job.jobType}</p>}
            
            {job.description && (
              <div style={{ margin: "8px 0", fontSize: "13px" }}>
                <strong>Description:</strong>
                <div style={{ marginTop: "4px", color: "#555", whiteSpace: "pre-wrap" }}>
                  {job.description.substring(0, 200)}{job.description.length > 200 ? "..." : ""}
                </div>
              </div>
            )}
            {job.url && (
              <p style={{ margin: "4px 0", fontSize: "13px" }}>
                <strong>Link:</strong> <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ color: "#4f8ef7", textDecoration: "underline" }}
                >
                  View Posting →
                </a>
              </p>
            )}
            {job.notes && (
              <div style={{ margin: "8px 0", fontSize: "13px", background: "#fffbea", padding: "8px", borderRadius: "4px" }}>
                <strong>Notes:</strong> {job.notes.substring(0, 150)}{job.notes.length > 150 ? "..." : ""}
              </div>
            )}
            {job.contacts && (
              <div style={{ margin: "8px 0", fontSize: "13px", background: "#e3f2fd", padding: "8px", borderRadius: "4px" }}>
                <strong>Contacts:</strong> {job.contacts.substring(0, 100)}{job.contacts.length > 100 ? "..." : ""}
              </div>
            )}
            {job.archiveReason && (
              <div style={{ margin: "8px 0", fontSize: "13px", background: "#ffebee", padding: "8px", borderRadius: "4px" }}>
                <strong>Archive Reason:</strong> {job.archiveReason}
              </div>
            )}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px" }}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onView(job); 
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ 
                  ...buttonStyle, 
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "#4f8ef7", 
                  color: "white" 
                }}
              >
                👁 View Full
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onEdit(job); 
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ 
                  ...buttonStyle,
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "#34c759", 
                  color: "white" 
                }}
              >
                ✏ Edit
              </button>
              {!job.archived && onArchive && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    const reason = prompt("Reason for archiving (optional):");
                    if (reason !== null) {
                      onArchive(job.id, reason);
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ 
                    ...buttonStyle,
                    padding: "6px 12px",
                    fontSize: "12px",
                    background: "#607d8b", 
                    color: "white" 
                  }}
                >
                  🗄 Archive
                </button>
              )}
              {job.archived && onRestore && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onRestore(job.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ 
                    ...buttonStyle,
                    padding: "6px 12px",
                    fontSize: "12px",
                    background: "#4caf50", 
                    color: "white" 
                  }}
                >
                  ♻️ Restore
                </button>
              )}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDelete(job.id); 
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{ 
                  ...buttonStyle,
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "#ff3b30", 
                  color: "white" 
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}