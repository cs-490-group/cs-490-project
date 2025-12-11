import React, { useState } from "react";
import ProjectsAPI from "../../api/projects";

const statusColors = {
  Planned: "#2196f3",
  Ongoing: "#ff9800",
  Completed: "#4caf50"
};

const statusEmojis = {
  Planned: "📅",
  Ongoing: "🔄",
  Completed: "✅"
};

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

export default function ProjectCard({ project, deleteProject, onEdit, expanded, onToggle, onMediaDelete }) {
  const [zoomedImage, setZoomedImage] = useState(null);
  const [hoveredMediaId, setHoveredMediaId] = useState(null);
  
  const handleCardClick = (e) => {
    if (e.target === e.currentTarget || e.target.closest('[data-card-content]')) {
      onToggle(project.id);
    }
  };
  
  const isImage = (filename) => /\.(png|jpe?g|gif|webp)$/i.test(filename);
  const statusColor = statusColors[project.status] || "#666";
  const statusEmoji = statusEmojis[project.status] || "📋";

  const getImageSrc = (file) => {
    if (file.url) {
      return file.url;
    }
    return null;
  };

  const thumbnailImage = project.thumbnail_id
    ? project.media_files?.find(file => file.filename === project.thumbnail_id && isImage(file.filename))
    : project.media_files?.find(file => isImage(file.filename));

  const handleDeleteMedia = async (mediaId, filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }

    try {
      await ProjectsAPI.deleteMedia(mediaId);
      
      // Trigger reload of projects
      if (onMediaDelete) {
        onMediaDelete();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.detail || "Error deleting media file");
    }
  };

  const handleSetThumbnail = async (filename) => {
    if (!window.confirm(`Do you want to set the thumbnail to ${filename}?`)) {
      return;
    }

    try {
      // Get the current project data
      const currentData = {
        project_name: project.project_name,
        description: project.description,
        role: project.role,
        start_date: project.start_date,
        end_date: project.end_date,
        skills: project.skills,
        team_size: project.team_size,
        details: project.details,
        achievements: project.achievements,
        industry: project.industry,
        status: project.status,
        project_url: project.project_url,
        thumbnail_id: filename
      };
      
      // Update the project with the new thumbnail_id
      await ProjectsAPI.update(project.id, currentData);

      // Trigger reload of projects to refresh the thumbnail
      if (onMediaDelete) {
        await onMediaDelete();
      }
    } catch (err) {
      console.error("Set thumbnail error:", err);
      alert(err.response?.data?.detail || "Error setting thumbnail");
    }
  };

  return (
    <>
      <div
        style={{
          border: "2px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "white",
          boxShadow: expanded ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 8px rgba(0,0,0,0.1)",
          transition: "box-shadow 0.2s",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          minHeight: expanded ? "auto" : "150px"
        }}
        onClick={handleCardClick}
      >
        {thumbnailImage && (
          <div 
            style={{ 
              marginBottom: "12px",
              marginLeft: "-16px",
              marginRight: "-16px",
              marginTop: "-16px",
              borderRadius: "8px 8px 0 0",
              overflow: "hidden",
              position: "relative"
            }}
          >
            <img
              src={getImageSrc(thumbnailImage)}
              alt="Project thumbnail"
              style={{
                width: "100%",
                height: "100px",
                objectFit: "cover",
                cursor: "pointer"
              }}
              onClick={handleCardClick}
            />
            <div style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: statusColor,
              color: "white",
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}>
              <span>{statusEmoji}</span>
              {project.status}
            </div>
          </div>
        )}

        {!thumbnailImage && (
          <div style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: statusColor,
            color: "white",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <span>{statusEmoji}</span>
            {project.status}
          </div>
        )}

        <div style={{ paddingRight: thumbnailImage ? "0" : "100px" }} data-card-content>
          <h3 style={{
            margin: "0 0 8px 0",
            fontSize: "18px",
            color: "#333"
          }}>
            {project.project_name || project.name}
          </h3>

          {project.industry && (
            <div style={{
              display: "inline-block",
              background: "#e3f2fd",
              color: "#1976d2",
              padding: "4px 10px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              {project.industry}
            </div>
          )}

          <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
            <strong style={{ color: "#333" }}>Role:</strong> {project.role}
          </div>

          <div style={{ fontSize: "14px", color: "#666" }}>
            <strong style={{ color: "#333" }}>Timeline:</strong>{" "}
            {formatDate(project.start_date)} -{" "}
            {project.end_date ? formatDate(project.end_date) : "Present"}
          </div>
        </div>

        {expanded && (
          <div
            style={{ marginTop: "16px", paddingTop: "16px", borderTop: "2px solid #eee" }}
            onClick={(e) => e.stopPropagation()}
          >
            {project.description && (
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "14px" }}>Description:</strong>
                <p style={{ margin: "6px 0", color: "#555", fontSize: "13px", lineHeight: "1.6" }}>
                  {project.description}
                </p>
              </div>
            )}

            {(project.skills || project.technologies) && (
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "14px" }}>Technologies / Skills:</strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {(Array.isArray(project.skills) 
                    ? project.skills 
                    : Array.isArray(project.technologies)
                    ? project.technologies
                    : (project.skills || project.technologies || "").split(',').map(t => t.trim())
                  ).filter(Boolean).map((tech, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#f0f0f0",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: "#333"
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.team_size && (
              <div style={{ marginBottom: "12px", fontSize: "13px", color: "#666" }}>
                <strong style={{ color: "#333" }}>Team Size:</strong> {project.team_size} people
              </div>
            )}

            {project.project_url && (
              <div style={{ marginBottom: "12px", fontSize: "13px" }}>
                <strong style={{ color: "#333" }}>Project URL:</strong>{" "}
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2196f3", textDecoration: "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  View Project →
                </a>
              </div>
            )}

            {project.details && (
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "14px" }}>Project Details:</strong>
                <p style={{ margin: "6px 0", color: "#555", fontSize: "13px", lineHeight: "1.6" }}>
                  {project.details}
                </p>
              </div>
            )}

            {project.achievements && (
              <div style={{
                marginBottom: "12px",
                padding: "12px",
                background: "#fffbea",
                borderRadius: "6px",
                borderLeft: "3px solid #ffc107"
              }}>
                <strong style={{ color: "#333", fontSize: "14px" }}>🏆 Achievements:</strong>
                <p style={{ margin: "6px 0 0 0", color: "#555", fontSize: "13px", lineHeight: "1.6" }}>
                  {project.achievements}
                </p>
              </div>
            )}

            {project.media_files?.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ color: "#333", fontSize: "14px", display: "block", marginBottom: "8px" }}>
                  📸 Media Files:
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {project.media_files.map((file, idx) => {
                    const imageSrc = getImageSrc(file);
                    const isImageFile = isImage(file.filename);
                    const isThumbnail = file.filename === project.thumbnail_id;
                    
                    return (
                      <div 
                        key={idx} 
                        style={{ position: "relative" }}
                        onMouseEnter={() => setHoveredMediaId(file.media_id)}
                        onMouseLeave={() => setHoveredMediaId(null)}
                      >
                        {isImageFile && imageSrc ? (
                          <>
                            <img
                              src={imageSrc}
                              alt={file.filename}
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                cursor: "zoom-in",
                                border: isThumbnail ? "3px solid #4caf50" : "2px solid #ddd"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomedImage(imageSrc);
                              }}
                              onError={(e) => {
                                console.error('Image failed to load:', file.filename, imageSrc);
                                e.target.style.display = 'none';
                              }}
                            />
                            {isThumbnail && (
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: "4px",
                                  left: "4px",
                                  background: "rgba(76, 175, 80, 0.9)",
                                  color: "white",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  fontSize: "10px",
                                  fontWeight: "600"
                                }}
                              >
                                ⭐ Thumbnail
                              </div>
                            )}
                            {hoveredMediaId === file.media_id && (
                              <div style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                display: "flex",
                                gap: "4px"
                              }}>
                                {!isThumbnail && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSetThumbnail(file.filename);
                                    }}
                                    style={{
                                      background: "rgba(76, 175, 80, 0.9)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      padding: "4px 8px",
                                      cursor: "pointer",
                                      fontSize: "10px",
                                      fontWeight: "600",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "2px"
                                    }}
                                    title="Set as thumbnail"
                                  >
                                    ⭐
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMedia(file.media_id, file.filename);
                                  }}
                                  style={{
                                    background: "rgba(255, 59, 48, 0.9)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "10px",
                                    fontWeight: "600"
                                  }}
                                  title="Delete this image"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div
                              style={{
                                padding: "8px 12px",
                                background: "#f0f0f0",
                                borderRadius: "4px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              📎 {file.filename}
                            </div>
                            {hoveredMediaId === file.media_id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMedia(file.media_id, file.filename);
                                }}
                                style={{
                                  background: "#ff3b30",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "4px 8px",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  transition: "opacity 0.2s"
                                }}
                                title="Delete this file"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{
              display: "flex",
              gap: "10px",
              paddingTop: "12px",
              borderTop: "1px solid #eee"
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project.id);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#34c759",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteProject(project.id);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#ff3b30",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            cursor: "zoom-out"
          }}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
            }}
          />
        </div>
      )}
    </>
  );
}