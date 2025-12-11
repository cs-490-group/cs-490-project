import React, { useState, useEffect } from "react";
import ProjectForm from "./ProjectForm";
import ProjectCard from "./ProjectCard";
import ProjectsAPI from "../../api/projects";
import { useLocation } from "react-router-dom";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const location = useLocation();
  
  useEffect(() => {
    if (location.state?.showForm) {
      setShowForm(true);
    }
  }, [location.state]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await ProjectsAPI.getAll();

      const transformedProjects = await Promise.all((res.data || []).map(async project => {
        // Fetch associated media for each project
        let mediaFiles = [];

        try {
          const idsRes = await ProjectsAPI.getMediaIds(project._id);
          const mediaIds = idsRes.data.media_id_list || [];

          if (mediaIds.length > 0) {
            const mediaMetadata = await Promise.all(
              mediaIds.map(async (mediaId) => {
                try {
                  const metaRes = await ProjectsAPI.getMedia(mediaId);

                  if (metaRes.status === 200) {
                    const contentType = metaRes.headers["content-type"];
                    const blob = metaRes.data;
                    const url = URL.createObjectURL(blob);
                    
                    let filename = `file_${mediaId}`;
                    const contentDisposition = metaRes.headers["content-disposition"];

                    if (contentDisposition) {
                      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                      if (match && match[1]) {
                        filename = match[1].replace(/['"]/g, '').trim();
                      }
                    }
                    
                    if (filename === `file_${mediaId}` && contentType) {
                      const ext = contentType.split('/')[1];
                      if (ext) {
                        filename = `image_${mediaId}.${ext}`;
                      }
                    }
                    
                    return {
                      media_id: mediaId,
                      filename: filename,
                      url: url,
                      content_type: contentType || blob.type
                    };
                  }
                } catch (error) {
                  console.error(`Error fetching media ${mediaId}:`, error);
                }
                return null;
              })
            );

            mediaFiles = mediaMetadata.filter(f => f !== null);
          }
        } catch (error) {
          console.error("Error fetching media for project:", project._id, error);
        }

        return {
          id: project._id,
          project_name: project.project_name,
          description: project.description,
          role: project.role,
          start_date: project.start_date,
          end_date: project.end_date,
          skills: project.skills || [],
          team_size: project.team_size,
          details: project.details,
          achievements: project.achievements,
          industry: project.industry,
          status: project.status,
          project_url: project.project_url,
          thumbnail_id: project.thumbnail_id,
          media_files: mediaFiles
        };
      }));
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const sortProjects = (projectArray) => {
    return projectArray
      .map((p) => ({ ...p }))
      .sort((a, b) => {
        if (sort === "date_desc") return new Date(b.start_date) - new Date(a.start_date);
        if (sort === "date_asc") return new Date(a.start_date) - new Date(b.start_date);
        return 0;
      });
  };

  const addProject = async (projectData, mediaFiles) => {
    try {
      const res = await ProjectsAPI.add(projectData);

      if (res && res.data.project_id) {
        const projectId = res.data.project_id;

        // Upload media files if any
        if (mediaFiles && mediaFiles.length > 0) {
          for (const file of mediaFiles) {
            try {
              const mediaRes = await ProjectsAPI.uploadMedia(projectId, file);

              if (mediaRes.status !== 200) {
                console.error("Failed to upload file:", file.name);
              }
            } catch (error) {
              console.error("Error uploading file:", file.name, error);
            }
          }
        }

        await loadProjects();
      }
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add project:", error);
      alert(error.response?.data?.detail || "Failed to add project. Please try again.");
    }
  };

  const submitEdit = async (projectData, mediaFiles) => {
    try {
      await ProjectsAPI.update(editProject.id, projectData);

      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          try {
            const uploadRes = await ProjectsAPI.uploadMedia(editProject.id, file);

            if (uploadRes.status !== 200) {
              console.error("Failed to upload file:", file.name);
            }
          } catch (error) {
            console.error("Error uploading file:", file.name, error);
          }
        }
      }

      await loadProjects();
      setEditProject(null);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to update project:", error);
      alert(error.response?.data?.detail || "Failed to update project. Please try again.");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;

    try {
      await ProjectsAPI.delete(id);

      setProjects(projects.filter((p) => p.id !== id));
      if (expandedCardId === id) {
        setExpandedCardId(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(error.response?.data?.detail || "Failed to delete project. Please try again.");
    }
  };

  const handleCardToggle = (projectId) => {
    setExpandedCardId(expandedCardId === projectId ? null : projectId);
  };

  const filteredProjects = sortProjects(
    projects
      .filter((p) => {
        const s = search.toLowerCase();
        return (
          p.project_name?.toLowerCase().includes(s) ||
          p.role?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s) ||
          p.details?.toLowerCase().includes(s) ||
          (Array.isArray(p.skills) && p.skills.some((t) => t.toLowerCase().includes(s)))
        );
      })
      .filter((p) =>
        industrySearch
          ? p.industry?.toLowerCase().includes(industrySearch.toLowerCase())
          : true
      )
      .filter((p) => (statusFilter ? p.status === statusFilter : true))
  );

  if (loading) {
    return (
      <div style={{ 
        background: "linear-gradient(135deg, #005e9e, #00c28a)",
        minHeight: "100vh",
        padding: "40px 20px",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{
            textAlign: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontFamily: '"Playfair Display", serif',
            marginBottom: "40px"
          }}>
            🚀 Special Projects
          </h1>
          <div style={{ 
            textAlign: "center", 
            color: "white",
            padding: "40px"
          }}>
            <p style={{ fontSize: "18px" }}>Loading Special Projects data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, #005e9e, #00c28a)",
      minHeight: "100vh",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header Section */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          marginBottom: "30px",
        }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{
              margin: 0,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontFamily: '"Playfair Display", serif',
            }}>
              🚀 Special Projects
            </h1>
            <div style={{
              width: "120px",
              height: "4px",
              margin: "6px auto 0",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #00c28a, #005e9e)",
            }} />
          </div>
          
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditProject(null);
            }}
            style={{
              padding: "12px 24px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            {showForm ? "← Cancel" : "+ Add Project"}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <ProjectForm
            addProject={addProject}
            editProject={editProject ? { ...editProject, submit: submitEdit } : null}
            cancelEdit={() => {
              setEditProject(null);
              setShowForm(false);
            }}
          />
        )}

        {/* Filters and Project List */}
        {!showForm && (
          <>
            <div style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
              }}>
                <input
                  placeholder="🔍 Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: "1 1 200px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
                <input
                  placeholder="Industry..."
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  style={{
                    flex: "1 1 150px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    flex: "1 1 150px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">All Status</option>
                  <option value="Planned">Planned</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    flex: "1 1 150px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">Sort By...</option>
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                </select>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: "0 1 auto",
                    padding: "10px 20px",
                    background: "#4f4f4f",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    minWidth: "100px",
                  }}
                >
                  🖨️ Print
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div style={{
                background: "#f9f9f9",
                padding: "40px",
                borderRadius: "8px",
                textAlign: "center",
                color: "#999"
              }}>
                <p style={{ fontSize: "16px" }}>
                  {search || industrySearch || statusFilter
                    ? "No projects match your filters"
                    : "No projects yet. Add your first one!"}
                </p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "16px",
                alignItems: "start"
              }}>
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    deleteProject={deleteProject}
                    onEdit={(id) => {
                      const proj = projects.find(p => p.id === id);
                      setEditProject(proj);
                      setShowForm(true);
                    }}
                    expanded={expandedCardId === p.id}
                    onToggle={handleCardToggle}
                    onMediaDelete={loadProjects}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}