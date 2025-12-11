import React, { useState } from 'react';
import '../../styles/resumes.css';

/**
 * VersionComparison Component
 * Compare two resume versions side-by-side with detailed differences
 * Related to UC-052
 */
export default function VersionComparison({ version1, version2 }) {
  const [expandedSections, setExpandedSections] = useState({});

  if (!version1 || !version2) {
    return <div className="alert alert-warning">Please select two versions to compare</div>;
  }

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Helper function to safely get nested values
  const getResumeData = (version) => {
    return version.resume_data || {};
  };

  // Compare two values and return if they're different
  const compareValues = (val1, val2) => {
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      return JSON.stringify(val1) !== JSON.stringify(val2);
    }
    return val1 !== val2;
  };

  // Build comparison sections
  const sections = [
    {
      name: 'Contact Information',
      key: 'contact',
      renderer: (data) => {
        const contact = data.contact || {};
        return `${contact.name || ''} | ${contact.email || ''} | ${contact.phone || ''}`;
      },
    },
    {
      name: 'Professional Summary',
      key: 'summary',
      renderer: (data) => data.summary || '(No summary)',
    },
    {
      name: 'Experience',
      key: 'experience',
      renderer: (data) => {
        const exp = data.experience || [];
        return exp.length > 0
          ? `${exp.length} position(s): ${exp.map((e) => e.title || 'Untitled').join(', ')}`
          : '(No experience)';
      },
    },
    {
      name: 'Education',
      key: 'education',
      renderer: (data) => {
        const edu = data.education || [];
        return edu.length > 0
          ? `${edu.length} degree(s): ${edu.map((e) => e.degree || 'Unknown').join(', ')}`
          : '(No education)';
      },
    },
    {
      name: 'Skills',
      key: 'skills',
      renderer: (data) => {
        const skills = data.skills || [];
        if (skills.length === 0) return '(No skills)';
        const skillNames = skills.map((s) => s.name || 'Unknown');
        return skillNames.length > 5
          ? `${skillNames.slice(0, 5).join(', ')}... and ${skillNames.length - 5} more`
          : skillNames.join(', ');
      },
    },
    {
      name: 'Certifications',
      key: 'certifications',
      renderer: (data) => {
        const certs = data.certifications || [];
        return certs.length > 0
          ? `${certs.length} certification(s): ${certs.map((c) => c.name || 'Unknown').join(', ')}`
          : '(No certifications)';
      },
    },
    {
      name: 'Projects',
      key: 'projects',
      renderer: (data) => {
        const projects = data.projects || [];
        return projects.length > 0
          ? `${projects.length} project(s): ${projects.map((p) => p.name || 'Unknown').join(', ')}`
          : '(No projects)';
      },
    },
    {
      name: 'Template & Formatting',
      key: 'template',
      renderer: (data) => {
        const template = data.template || 'Default';
        return `Template: ${template}`;
      },
    },
  ];

  const resumeData1 = getResumeData(version1);
  const resumeData2 = getResumeData(version2);

  return (
    <div className="version-comparison-container">
      {/* Header with version info */}
      <div className="comparison-header">
        <div className="version-header-col">
          <h5>{version1.name}</h5>
          <p className="text-muted small">
            Created: {new Date(version1.date_created).toLocaleString()}
          </p>
          {version1.job_linked && <p className="badge bg-info">📌 Job: {version1.job_linked}</p>}
        </div>
        <div className="version-header-col">
          <h5>{version2.name}</h5>
          <p className="text-muted small">
            Created: {new Date(version2.date_created).toLocaleString()}
          </p>
          {version2.job_linked && <p className="badge bg-info">📌 Job: {version2.job_linked}</p>}
        </div>
      </div>

      {/* Comparison sections */}
      <div className="comparison-sections">
        <h6 className="mb-3">Detailed Comparison</h6>
        {sections.map((section) => {
          const val1 = resumeData1[section.key];
          const val2 = resumeData2[section.key];
          const isDifferent = compareValues(val1, val2);
          const isExpanded = expandedSections[section.key];

          return (
            <div
              key={section.key}
              className={`comparison-section ${isDifferent ? 'has-differences' : 'no-differences'}`}
            >
              <div
                className="section-header"
                onClick={() => toggleSection(section.key)}
                style={{ cursor: 'pointer' }}
              >
                <div className="section-title">
                  <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                  <h6>{section.name}</h6>
                  {isDifferent && <span className="badge bg-warning text-dark">Changed</span>}
                </div>
              </div>

              {isExpanded && (
                <div className="section-content">
                  <div className="comparison-row">
                    <div className="comparison-cell">
                      <strong>Version 1:</strong>
                      <p>{section.renderer(resumeData1)}</p>
                    </div>
                    <div className="comparison-cell">
                      <strong>Version 2:</strong>
                      <p>{section.renderer(resumeData2)}</p>
                    </div>
                  </div>

                  {/* Detailed comparison for specific sections */}
                  {section.key === 'experience' && (val1 || val2) && (
                    <div className="detailed-comparison">
                      <ExperienceComparison exp1={val1 || []} exp2={val2 || []} />
                    </div>
                  )}
                  {section.key === 'skills' && (val1 || val2) && (
                    <div className="detailed-comparison">
                      <SkillsComparison skills1={val1 || []} skills2={val2 || []} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="comparison-summary mt-4">
        <h6>Summary</h6>
        <p>
          {sections.filter((s) => compareValues(resumeData1[s.key], resumeData2[s.key])).length === 0
            ? '✓ These versions are identical'
            : `⚠ ${sections.filter((s) => compareValues(resumeData1[s.key], resumeData2[s.key])).length} section(s) differ between these versions`}
        </p>
      </div>
    </div>
  );
}

/**
 * ExperienceComparison Component
 * Shows detailed comparison of work experience
 */
function ExperienceComparison({ exp1, exp2 }) {
  const allPositions = [
    ...exp1.map((e, i) => ({ ...e, version: 1, index: i })),
    ...exp2.map((e, i) => ({ ...e, version: 2, index: i })),
  ];

  const added = exp2.filter((e2, i) => !exp1.some((e1) => e1.company === e2.company && e1.title === e2.title));
  const removed = exp1.filter((e1, i) => !exp2.some((e2) => e2.company === e1.company && e2.title === e1.title));

  return (
    <div className="experience-comparison">
      {added.length > 0 && (
        <div className="comparison-detail">
          <h6 className="text-success">Added Positions:</h6>
          <ul>
            {added.map((exp, idx) => (
              <li key={idx}>
                <strong>{exp.title}</strong> at {exp.company}
              </li>
            ))}
          </ul>
        </div>
      )}
      {removed.length > 0 && (
        <div className="comparison-detail">
          <h6 className="text-danger">Removed Positions:</h6>
          <ul>
            {removed.map((exp, idx) => (
              <li key={idx}>
                <strong>{exp.title}</strong> at {exp.company}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * SkillsComparison Component
 * Shows detailed comparison of skills
 */
function SkillsComparison({ skills1, skills2 }) {
  const skillNames1 = skills1.map((s) => s.name);
  const skillNames2 = skills2.map((s) => s.name);

  const added = skillNames2.filter((s) => !skillNames1.includes(s));
  const removed = skillNames1.filter((s) => !skillNames2.includes(s));

  return (
    <div className="skills-comparison">
      {added.length > 0 && (
        <div className="comparison-detail">
          <h6 className="text-success">Added Skills:</h6>
          <div className="skill-badges">
            {added.map((skill, idx) => (
              <span key={idx} className="badge bg-success">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {removed.length > 0 && (
        <div className="comparison-detail">
          <h6 className="text-danger">Removed Skills:</h6>
          <div className="skill-badges">
            {removed.map((skill, idx) => (
              <span key={idx} className="badge bg-danger">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
