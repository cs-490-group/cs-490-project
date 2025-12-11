import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SkillItem from "./SkillItem";

const categoryMeta = {
  Technical: { color: "#4f8ef7", emoji: "💻" },
  "Soft Skills": { color: "#34c759", emoji: "🗣️" },
  Languages: { color: "#ff9500", emoji: "🌐" },
  "Industry-Specific": { color: "#af52de", emoji: "🏭" }
};

export default function SkillCategory({ category, skills, updateSkill, removeSkill, activeId }) {
  const [filterTerm, setFilterTerm] = useState("");
  const meta = categoryMeta[category] || { color: "#ccc", emoji: "📋" };

  const { setNodeRef: droppableRef, isOver } = useDroppable({ 
    id: `droppable-${category}` 
  });

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const proficiencySummary = skills.reduce((acc, s) => {
    acc[s.proficiency] = (acc[s.proficiency] || 0) + 1;
    return acc;
  }, {});

  const exportCategory = () => {
    let text = `${category} (${skills.length})\n`;
    text += Object.entries(proficiencySummary)
      .map(([level, count]) => `${level}: ${count}`)
      .join(", ") + "\n\n";
    skills.forEach((s) => {
      text += `• ${s.name} - ${s.proficiency}\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${category}_skills.txt`;
    link.click();
  };

  return (
    <div style={{
      padding: "12px",
      border: "2px solid #ddd",
      borderRadius: "8px",
      minHeight: "300px",
      display: "flex",
      flexDirection: "column",
      background: "#f9f9f9"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: `3px solid ${meta.color}`
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: "16px", 
          color: meta.color,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "20px" }}>{meta.emoji}</span>
          {category}
        </h3>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{
            background: meta.color,
            color: "white",
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            {skills.length}
          </span>
          <button 
            onClick={exportCategory}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            📥 Export
          </button>
        </div>
      </div>

      <input
        placeholder={`Filter ${category}...`}
        value={filterTerm}
        onChange={(e) => setFilterTerm(e.target.value)}
        style={{ 
          marginBottom: "12px", 
          padding: "8px",
          width: "100%", 
          boxSizing: "border-box",
          border: "1px solid #ccc",
          borderRadius: "4px",
          fontSize: "13px"
        }}
      />

      {Object.keys(proficiencySummary).length > 0 && (
        <div style={{ 
          fontSize: "12px", 
          marginBottom: "12px",
          color: "#666",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          {Object.entries(proficiencySummary).map(([level, count]) => (
            <span key={level} style={{
              background: "#e8e8e8",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px"
            }}>
              {level}: {count}
            </span>
          ))}
        </div>
      )}

      <SortableContext 
        items={filteredSkills.map(s => s.id)} 
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={droppableRef}
          style={{ 
            padding: "8px", 
            margin: 0,
            listStyle: "none", 
            minHeight: "200px",
            backgroundColor: isOver ? "#e8f4f8" : (filteredSkills.length === 0 ? "#f8f8f8" : "transparent"),
            borderRadius: "4px",
            transition: "background-color 0.2s",
            border: isOver ? "2px dashed #4f8ef7" : "2px dashed transparent",
            flexGrow: 1,
            boxSizing: "border-box",
            overflow: "auto",
          }}
        >
          {filteredSkills.length > 0 ? (
            filteredSkills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                updateSkill={updateSkill}
                removeSkill={removeSkill}
              />
            ))
          ) : (
            <li style={{ 
              padding: "40px 20px", 
              color: "#999", 
              textAlign: "center",
              pointerEvents: "none",
              listStyle: "none",
              fontSize: "14px"
            }}>
              {isOver ? "Drop skill here" : "No skills - drag items here or add new ones"}
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  );
}