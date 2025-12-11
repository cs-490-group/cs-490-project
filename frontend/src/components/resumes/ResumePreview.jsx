import React, { useState } from 'react';
import ResumeSectionWrapper from './ResumeSectionWrapper';
import '../../styles/resumes.css';

/**
 * ResumePreview Component
 * Displays formatted resume preview based on selected template
 * Supports three template types: Chronological, Functional, and Hybrid
 * Supports drag-and-drop reordering of sections
 * Related to UC-046, UC-053
 */
export default function ResumePreview({ resume, onSectionReorder }) {
  const [draggedSection, setDraggedSection] = useState(null);

  if (!resume) {
    return <div className="resume-preview-empty">No resume data</div>;
  }

  const { contact, summary, experience, skills, education, certifications, projects, colors, fonts, template, templateId, sections } = resume;

  // Apply custom colors and fonts if provided
  const styles = {
    '--primary-color': colors?.primary || '#1a1a1a',
    '--accent-color': colors?.accent || '#2c3e50',
    '--heading-font': fonts?.heading || 'Calibri',
    '--body-font': fonts?.body || 'Calibri',
  };

  // Drag-and-drop handlers
  const handleDragStart = (e, sectionId) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetSectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId || !onSectionReorder) {
      return;
    }

    // Reorder sections
    const sectionList = [...(sections || [])];
    const draggedIndex = sectionList.indexOf(draggedSection);
    const targetIndex = sectionList.indexOf(targetSectionId);

    if (draggedIndex > -1 && targetIndex > -1) {
      // Remove dragged item and insert at target position
      sectionList.splice(draggedIndex, 1);
      sectionList.splice(targetIndex, 0, draggedSection);
      onSectionReorder(sectionList);
    }

    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  // Helper function to render contact information content
  const renderContactInfoContent = () => (
    <>
      {contact && (
        <div className="resume-header">
          <h1 className="resume-name">{contact.name || 'Your Name'}</h1>
          <div className="contact-line">
            {contact.phone && <span>{contact.phone}</span>}
            {contact.phone && contact.email && <span className="separator">|</span>}
            {contact.email && <span>{contact.email}</span>}
            {contact.email && (contact.address || contact.location) && <span className="separator">|</span>}
            {(contact.address || contact.location) && <span>{contact.address || contact.location}</span>}
            {contact.linkedin && <span className="separator">|</span>}
            {contact.linkedin && <span>{contact.linkedin}</span>}
          </div>
        </div>
      )}
    </>
  );

  // Wrapped contact section for drag-and-drop
  const renderContactInfo = () => (
    <ResumeSectionWrapper
      sectionId="contact"
      isDragging={draggedSection === 'contact'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderContactInfoContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render experience section content
  const renderExperienceContent = () => (
    <>
      {experience && experience.length > 0 && (
        <div className="resume-section">
          <h2 className="section-heading">PROFESSIONAL EXPERIENCE</h2>
          {experience.map((exp) => {
            // Handle both string and object descriptions
            const getDescriptionText = (desc) => {
              if (!desc) return null;
              if (typeof desc === 'string') return desc;
              if (typeof desc === 'object' && desc.description) return desc.description;
              return null;
            };

            const descriptionText = getDescriptionText(exp.description);

            // Split description by newlines to create separate bullet points
            const bulletPoints = descriptionText
              ? descriptionText.split('\n').filter(line => line.trim() !== '')
              : [];

            return (
              <div key={exp.id} className="experience-entry">
                <div className="exp-header-row">
                  <h3 className="job-title">{exp.position || 'Job Title'}</h3>
                  <span className="date-range">
                    {exp.startDate} – {exp.endDate}
                  </span>
                </div>
                <div className="company-name">{exp.company || 'Company Name'}</div>
                <ul className="description-list">
                  {bulletPoints.length > 0 ? (
                    bulletPoints.map((bullet, idx) => (
                      <li key={idx}>{bullet.trim()}</li>
                    ))
                  ) : descriptionText ? (
                    <li>{descriptionText}</li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  // Wrapped experience section for drag-and-drop
  const renderExperience = () => (
    <ResumeSectionWrapper
      sectionId="experience"
      isDragging={draggedSection === 'experience'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderExperienceContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render education section content
  const renderEducationContent = () => (
    <>
      {education && education.length > 0 && (
        <div className="resume-section">
          <h2 className="section-heading">EDUCATION</h2>
          {education.map((edu) => (
            <div key={edu.id} className="education-entry">
              <div className="edu-header-row">
                <h3 className="degree">{edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}</h3>
                <span className="graduation-year">{edu.year || 'Year'}</span>
              </div>
              <div className="school-name">{edu.school || 'School Name'}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  // Wrapped education section for drag-and-drop
  const renderEducation = () => (
    <ResumeSectionWrapper
      sectionId="education"
      isDragging={draggedSection === 'education'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderEducationContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render skills section content
  const renderSkillsContent = () => (
    <>
      {skills && skills.length > 0 && (
        <div className="resume-section">
          <h2 className="section-heading">SKILLS</h2>
          <div className="skills-content">
            {skills.map((skill, idx) => {
              // Handle both string and object formats
              const skillName = typeof skill === 'string' ? skill : (skill.name || '');
              return (
                <span key={idx} className="skill-item">
                  {skillName}{idx < skills.length - 1 ? ' • ' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  // Wrapped skills section for drag-and-drop
  const renderSkills = () => (
    <ResumeSectionWrapper
      sectionId="skills"
      isDragging={draggedSection === 'skills'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderSkillsContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render certifications section content
  const renderCertificationsContent = () => (
    <>
      {certifications && certifications.length > 0 && (
        <div className="resume-section">
          <h2 className="section-heading">CERTIFICATIONS</h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="certification-entry">
              <div className="certification-header">
                <strong>{cert.name}</strong>
                <span className="date">{cert.dateEarned}</span>
              </div>
              {cert.issuer && <p className="issuer">{cert.issuer}</p>}
              {cert.certNumber && <p className="cert-id">ID: {cert.certNumber}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );

  // Wrapped certifications section for drag-and-drop
  const renderCertifications = () => (
    <ResumeSectionWrapper
      sectionId="certifications"
      isDragging={draggedSection === 'certifications'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderCertificationsContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render projects section content
  const renderProjectsContent = () => (
    <>
      {projects && projects.length > 0 && (
        <div className="resume-section">
          <h2 className="section-heading">PROJECTS</h2>
          {projects.map((project) => (
            <div key={project.id} className="project-entry">
              <div className="project-header">
                <strong>{project.title}</strong>
                <span className="date">
                  {project.startDate} {project.endDate ? `- ${project.endDate}` : ''}
                </span>
              </div>
              {project.role && <p className="role">{project.role}</p>}
              {project.description && <p className="description">{project.description}</p>}
              {project.skills && project.skills.length > 0 && (
                <p className="skills"><strong>Skills:</strong> {Array.isArray(project.skills) ? project.skills.join(', ') : project.skills}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  // Wrapped projects section for drag-and-drop
  const renderProjects = () => (
    <ResumeSectionWrapper
      sectionId="projects"
      isDragging={draggedSection === 'projects'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderProjectsContent()}
    </ResumeSectionWrapper>
  );

  // Helper function to render summary section content
  const renderSummaryContent = () => (
    <>
      {summary && (
        <div className="resume-section">
          <h2 className="section-heading">PROFESSIONAL SUMMARY</h2>
          <p className="summary-text">{summary}</p>
        </div>
      )}
    </>
  );

  // Wrapped summary section for drag-and-drop
  const renderSummary = () => (
    <ResumeSectionWrapper
      sectionId="summary"
      isDragging={draggedSection === 'summary'}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      {renderSummaryContent()}
    </ResumeSectionWrapper>
  );

  // Map section IDs to render functions
  const sectionRenderMap = {
    contact: renderContactInfo,
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    certifications: renderCertifications,
    projects: renderProjects,
    skills: renderSkills,
  };

  // Generic section renderer - respects section order
  const renderSectionsByOrder = (sectionOrder) => (
    <>
      {sectionOrder && sectionOrder.map((sectionId) => {
        const renderFunc = sectionRenderMap[sectionId];
        return renderFunc ? <div key={sectionId}>{renderFunc()}</div> : null;
      })}
    </>
  );

  // PROFESSIONAL TEMPLATE: Clean and traditional business style
  const renderProfessional = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return renderSectionsByOrder(sectionOrder);
  };

  // MODERN TEMPLATE: Sleek, contemporary design
  const renderModern = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return renderSectionsByOrder(sectionOrder);
  };

  // MINIMAL TEMPLATE: Ultra-clean and space-efficient
  const renderMinimal = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return renderSectionsByOrder(sectionOrder);
  };

  // CREATIVE TEMPLATE: Colorful and visually engaging
  const renderCreative = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return renderSectionsByOrder(sectionOrder);
  };

  // TECHNICAL TEMPLATE: Code-inspired and developer-friendly
  const renderTechnical = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return renderSectionsByOrder(sectionOrder);
  };

  // MODERN-GRADIENT TEMPLATE: Modern with gradient accent divider
  const renderModernGradient = () => {
    const defaultOrder = ['contact', 'summary', 'experience', 'education', 'certifications', 'projects', 'skills'];
    const sectionOrder = sections && sections.length > 0 ? sections : defaultOrder;
    return (
      <div className="modern-gradient-layout">
        {renderContactInfo()}
        <div className="gradient-divider" style={{
          height: '3px',
          background: `linear-gradient(90deg, ${colors?.primary || '#667eea'}, ${colors?.accent || '#764ba2'})`,
          margin: '15px 0'
        }} />
        {renderSectionsByOrder(sectionOrder.filter(s => s !== 'contact'))}
      </div>
    );
  };

  // Select which template to render
  const getTemplateContent = () => {
    // Map template IDs to dedicated render functions with distinct visual styles
    const templateRenderMap = {
      'professional-clean': renderProfessional,    // Traditional corporate style
      'modern-bold': renderModern,                 // Contemporary design with purple gradient header
      'modern-gradient': renderModernGradient,     // Modern with gradient accent divider
      'minimal-zen': renderMinimal,                // Ultra-minimalist design
      'creative-vibrant': renderCreative,          // Colorful and visually engaging
      'academic-formal': renderTechnical,          // Formal academic style
    };

    // Use template-specific render function if available
    if (templateId && templateRenderMap[templateId]) {
      const renderFunc = templateRenderMap[templateId];
      return renderFunc();
    }

    // For old template field (backward compatibility)
    switch (template?.toLowerCase()) {
      case 'professional':
        return renderProfessional();
      case 'modern':
        return renderModern();
      case 'minimal':
        return renderMinimal();
      case 'creative':
        return renderCreative();
      case 'technical':
        return renderTechnical();
      case 'chronological':
      case 'functional':
      case 'hybrid':
        return renderProfessional();
      default:
        return renderProfessional();
    }
  };

  // Use new templateId if available, otherwise fall back to old template field for backward compatibility
  const templateClass = templateId
    ? templateId.toLowerCase()
    : template?.toLowerCase() || 'professional';

  return (
    <div className="resume-preview-container">
      <div className={`resume-preview template-${templateClass}`} style={styles}>
        {getTemplateContent()}
      </div>
    </div>
  );
}
