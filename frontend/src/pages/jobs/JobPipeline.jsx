  import React from "react";
  import { useDroppable } from "@dnd-kit/core";
  import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
  import JobCard from "./JobCard";

  export default function JobPipeline({ stage, jobs, onView, onEdit, onDelete, onArchive, onRestore, activeId, onSelect, selectedJobIds }) {
    const stageColors = {
      "Interested": "#9e9e9e",
      "Applied": "#2196f3",
      "Screening": "#ff9800",
      "Interview": "#ff5722",
      "Offer": "#4caf50",
      "Rejected": "#f44336"
    };

    const stageEmojis = {
      "Interested": "🤔",
      "Applied": "📤",
      "Screening": "📞",
      "Interview": "💼",
      "Offer": "🎉",
      "Rejected": "❌"
    };

    const { setNodeRef: droppableRef, isOver } = useDroppable({ id: `droppable-${stage}` });

    const color = stageColors[stage] || "#666";
    const emoji = stageEmojis[stage] || "📋";

    return (
      <div
        ref={droppableRef}
        style={{
          background: isOver ? "#e3f2fd" : "#f5f5f5",
          borderRadius: "8px",
          padding: "16px",
          minHeight: "500px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "12px",
            background: color,
            color: "white",
            borderRadius: "6px",
            fontWeight: "bold",
          }}
        >
          <span style={{ fontSize: "16px" }}>
            {emoji} {stage}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.3)",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            {jobs.length}
          </span>
        </div>

        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onSelect={onSelect}
                  isSelected={selectedJobIds?.includes(job.id)}
                />
              ))
            ) : (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "14px",
                  border: "2px dashed #ddd",
                  borderRadius: "6px",
                }}
              >
                {isOver ? "Drop here to move job" : "No jobs in this stage"}
              </div>
            )}
          </ul>
        </SortableContext>
      </div>
    );
  }