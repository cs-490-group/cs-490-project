  import React from "react";
  import { useSortable } from "@dnd-kit/sortable";
  import { CSS } from "@dnd-kit/utilities";

  const categoryMeta = {
    Technical: { color: "#4f8ef7", emoji: "💻" },
    "Soft Skills": { color: "#34c759", emoji: "🗣️" },
    Languages: { color: "#ff9500", emoji: "🌐" },
    "Industry-Specific": { color: "#af52de", emoji: "🏭" }
  };

  export default function SkillItem({ skill, updateSkill, removeSkill, isOverlay }) {
    const { 
      attributes, 
      listeners, 
      setNodeRef, 
      transform, 
      transition, 
      isDragging 
    } = useSortable({ 
      id: skill.id,
      disabled: isOverlay
    });

    const meta = categoryMeta[skill.category] || { color: "#ccc", emoji: "📋" };

    const style = isOverlay ? {} : {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const itemStyle = {
      display: "flex",
      gap: "8px",
      alignItems: "center",
      padding: "10px 12px",
      borderRadius: "6px",
      backgroundColor: "white",
      border: isDragging ? `2px solid ${meta.color}` : "1px solid #ddd",
      boxShadow: isDragging ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 3px rgba(0,0,0,0.1)",
      transition: "all 0.2s",
      boxSizing: "border-box",
      marginBottom: "8px",
      cursor: "grab"
    };

    /*
    const proficiencyColors = {
      Beginner: "#9e9e9e",
      Intermediate: "#2196f3",
      Advanced: "#ff9800",
      Expert: "#4caf50"
    };
    */

    const selectStyle = {
      padding: "4px 8px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "600",
      color: "#444", //|| proficiencyColors[skill.proficiency],
      flexShrink: 0,
    };

    const buttonStyle = {
      padding: "4px 8px",
      border: "none",
      borderRadius: "4px",
      backgroundColor: "#ff3b30",
      color: "white",
      cursor: "pointer",
      fontSize: "12px",
      transition: "background-color 0.2s",
      flexShrink: 0,
      fontWeight: "600"
    };

    return (
      <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div style={itemStyle}>
          <span style={{ 
            fontSize: "18px", 
            flexShrink: 0,
            userSelect: "none"
          }}>
            {meta.emoji}
          </span>
          
          <span style={{ 
            flexGrow: 1, 
            fontSize: "14px", 
            fontWeight: "600",
            color: "#333",
            userSelect: "none",
            minWidth: 0,
            wordBreak: "break-word"
          }}>
            {skill.name}
          </span>
          
          <select
            value={skill.proficiency}
            onChange={(e) => {
              e.stopPropagation();
              updateSkill(skill.id, { proficiency: e.target.value });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={selectStyle}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Expert</option>
          </select>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeSkill(skill.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={buttonStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#ff1f1f"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ff3b30"}
          >
            🗑
          </button>
        </div>
      </li>
    );
  }