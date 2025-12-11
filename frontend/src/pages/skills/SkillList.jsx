import React, { useState, useEffect } from "react";
import SkillForm from "./SkillForm";
import SkillCategory from "./SkillCategory";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SkillItem from "./SkillItem";
import SkillsAPI from "../../api/skills";
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

export default function SkillList() {
  const [skills, setSkills] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  const categories = ["Technical", "Soft Skills", "Languages", "Industry-Specific"];

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const res = await SkillsAPI.getAll();
      const transformedSkills = (res.data || []).map(skill => ({
        id: skill._id,
        name: skill.name,
        category: skill.category || "Technical",
        proficiency: skill.proficiency || "Intermediate",
        position: skill.position || 0
      }));
      setSkills(transformedSkills);
    } catch (error) {
      console.error("Failed to load skills:", error);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (skill) => {
    try {
      const categorySkills = skills.filter(s => s.category === skill.category);
      const newPosition = categorySkills.length;
      
      const skillData = {
        name: skill.name,
        category: skill.category,
        proficiency: skill.proficiency,
        position: newPosition
      };

      const res = await SkillsAPI.add(skillData);

      if (res && res.data.skill_id) {
        const newSkill = { ...skillData, id: res.data.skill_id };
        setSkills([...skills, newSkill]);
      }
    } catch (error) {
      console.error("Failed to add skill:", error);
      alert(error.response?.data?.detail || "Failed to add skill. Please try again.");
    }
  };

  const updateSkill = async (id, updatedFields) => {
    try {
      await SkillsAPI.update(id, updatedFields);

      setSkills((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
      );
    } catch (error) {
      console.error("Failed to update skill:", error);
      alert(error.response?.data?.detail || "Failed to update skill. Please try again.");
    }
  };

  const removeSkill = async (id) => {
    if (!window.confirm("Remove this skill?")) return;
    
    try {
      await SkillsAPI.delete(id);

      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete skill:", error);
      alert(error.response?.data?.detail || "Failed to delete skill. Please try again.");
    }
  };

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!active || !over) return;

    const activeSkill = skills.find((s) => s.id === active.id);
    if (!activeSkill) return;

    let newCategory = activeSkill.category;
    let newPosition = 0;

    if (over.id.toString().startsWith('droppable-')) {
      newCategory = over.id.toString().replace('droppable-', '');
      const categorySkills = skills.filter((s) => s.category === newCategory && s.id !== activeSkill.id);
      newPosition = categorySkills.length;
    } else {
      const overSkill = skills.find((s) => s.id === over.id);
      if (overSkill) {
        newCategory = overSkill.category;
        newPosition = overSkill.position;
      }
    }

    const oldCategory = activeSkill.category;
    const oldPosition = activeSkill.position;

    if (oldCategory === newCategory && oldPosition === newPosition) return;

    const updatedSkills = skills.map((s) => {
      if (s.id === activeSkill.id) {
        return { ...s, category: newCategory, position: newPosition };
      }

      if (s.category === newCategory) {
        if (oldCategory === newCategory) {
          if (oldPosition < newPosition && s.position > oldPosition && s.position <= newPosition)
            return { ...s, position: s.position - 1 };
          if (oldPosition > newPosition && s.position >= newPosition && s.position < oldPosition)
            return { ...s, position: s.position + 1 };
        } else {
          if (s.position >= newPosition) return { ...s, position: s.position + 1 };
        }
      }

      if (s.category === oldCategory && oldCategory !== newCategory) {
        if (s.position > oldPosition) return { ...s, position: s.position - 1 };
      }

      return s;
    });

    setSkills(updatedSkills);

    try {
      await SkillsAPI.update(activeSkill.id, {category: newCategory, position: newPosition});

      const affectedSkills = updatedSkills.filter(s => 
        s.id !== activeSkill.id && 
        (s.category === newCategory || s.category === oldCategory)
      );

      await Promise.all(
        affectedSkills.map(skill =>
          SkillsAPI.update(skill.id, {position: skill.position})
        )
      );
    } catch (error) {
      console.error("Failed to update skill positions:", error);
      loadSkills();
    }
  };

  const activeSkillObj = skills.find((s) => s.id === activeId);

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!skill.name || !skill.name.toLowerCase().includes(searchTerm.toLowerCase())) return acc;
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {});

  // Sort each category by position
  Object.keys(groupedSkills).forEach(cat => {
    groupedSkills[cat].sort((a, b) => a.position - b.position);
  });

  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 py-4">
        <Container>
          <h1 className="text-center text-white fw-bold mb-5 display-4">
            Skills
          </h1>
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="light" className="mb-3" />
            <p className="text-white fs-5">Loading Skills data...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
    {/* makes sure the underline wrapper is with the text */}
      <div style={{ display: "inline-block", textAlign: "center", marginBottom: "20px" }}>
        <h1
          style={{
          margin: 0,
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "2.5rem",
          fontFamily: '"Playfair Display", serif',
          WebkitTextFillColor: "#ffffff", // ensures true white text
          }}
        >
        💡Skills Tracker
        </h1>

    <div
      style={{
        width: "110px", // adjust for desired length
        height: "4px",
        margin: "6px auto 0",
        borderRadius: "2px",
        background: "linear-gradient(90deg, #00c28a, #005e9e)", // green to blue
      }}
    />
  </div>

      <SkillForm addSkill={addSkill} existingSkills={skills} />

      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="🔍 Search all skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "12px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            boxSizing: "border-box"
          }}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div style={{ 
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}>
            {categories.map((cat) => (
              <SkillCategory
                key={cat}
                category={cat}
                skills={groupedSkills[cat] || []}
                updateSkill={updateSkill}
                removeSkill={removeSkill}
                activeId={activeId}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeSkillObj && (
            <div style={{ cursor: "grabbing", width: "300px" }}>
              <SkillItem
                skill={activeSkillObj}
                updateSkill={() => {}}
                removeSkill={() => {}}
                isOverlay={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 