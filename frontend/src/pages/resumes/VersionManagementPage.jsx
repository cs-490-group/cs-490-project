import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResumesAPI from '../../api/resumes';
import VersionComparison from '../../components/resumes/VersionComparison';
import '../../styles/resumes.css';

/**
 * VersionManagementPage Component
 * Manage resume versions, compare, and restore previous versions
 * Related to UC-052
 */
export default function VersionManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch versions from backend
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ResumesAPI.getVersions(id);
        setVersions(response.data || response);
      } catch (err) {
        setError(err.message || 'Failed to load versions');
        console.error('Error loading versions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [id]);

  const handleVersionSelect = (versionId) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((v) => v !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      }
      return prev;
    });
  };

  const handleRestore = async (versionId) => {
    if (window.confirm('Are you sure you want to restore this version?')) {
      try {
        await ResumesAPI.restoreVersion(id, versionId);
        alert('Version restored successfully!');
        navigate(`/resumes/edit/${id}`);
      } catch (err) {
        alert('Failed to restore version: ' + err.message);
      }
    }
  };

  const handleDelete = async (versionId) => {
    if (window.confirm('Are you sure you want to delete this version?')) {
      try {
        await ResumesAPI.deleteVersion(id, versionId);
        setVersions(versions.filter((v) => v._id !== versionId));
      } catch (err) {
        alert('Failed to delete version: ' + err.message);
      }
    }
  };

  const handleRename = async (versionId) => {
    const version = versions.find((v) => v._id === versionId);
    const newName = prompt('Enter new version name:', version.name);
    if (newName && newName.trim() && newName !== version.name) {
      try {
        await ResumesAPI.renameVersion(id, versionId, newName.trim());
        // Update local state
        setVersions(
          versions.map((v) =>
            v._id === versionId ? { ...v, name: newName.trim() } : v
          )
        );
        alert('Version renamed successfully!');
      } catch (err) {
        alert('Failed to rename version: ' + err.message);
      }
    }
  };

  const handleCreateFromVersion = async (versionId) => {
    const version = versions.find((v) => v._id === versionId);
    const newName = prompt('Enter name for new version:', `${version.name} (Copy)`);
    if (newName) {
      try {
        const cleanedData = cleanResumeData(version.resume_data);
        await ResumesAPI.createVersion(id, {
          name: newName,
          description: `Copy of ${version.name}`,
          resume_data: cleanedData,
        });
        alert(`New version "${newName}" created!`);
        // Refresh versions list
        const response = await ResumesAPI.getVersions(id);
        setVersions(response.data || response);
      } catch (err) {
        alert('Failed to create version: ' + err.message);
      }
    }
  };

  const handleMergeVersions = async () => {
    if (selectedVersions.length !== 2) {
      alert('Please select exactly 2 versions to merge');
      return;
    }

    const version1 = versions.find((v) => v._id === selectedVersions[0]);
    const version2 = versions.find((v) => v._id === selectedVersions[1]);

    const mergedName = prompt(
      'Enter name for merged version:',
      `${version1.name} + ${version2.name}`
    );

    if (!mergedName) return;

    try {
      // Merge: combine data from both versions (version2 takes precedence for conflicts)
      // Also clean the merged data to avoid MongoDB field issues
      const mergedData = cleanResumeData({
        ...version1.resume_data,
        ...version2.resume_data,
      });

      await ResumesAPI.createVersion(id, {
        name: mergedName.trim(),
        description: `Merged from "${version1.name}" and "${version2.name}"`,
        resume_data: mergedData,
      });

      alert('Versions merged successfully!');
      // Refresh versions list
      const response = await ResumesAPI.getVersions(id);
      setVersions(response.data || response);
      setSelectedVersions([]);
      setShowComparison(false);
    } catch (err) {
      alert('Failed to merge versions: ' + err.message);
    }
  };

  const handleLinkJob = async (versionId) => {
    const version = versions.find((v) => v._id === versionId);
    const jobId = prompt('Enter job ID or posting URL to link to this version:', version.job_linked || '');

    if (jobId !== null) {
      try {
        // Pass job_linked as the 4th parameter
        await ResumesAPI.renameVersion(id, versionId, version.name, version.description, jobId.trim() || null);

        // Update local state - update version with job_linked
        setVersions(
          versions.map((v) =>
            v._id === versionId ? { ...v, job_linked: jobId.trim() || null } : v
          )
        );
        alert('Job linked to version successfully!');
      } catch (err) {
        alert('Failed to link job: ' + err.message);
      }
    }
  };

  if (loading) {
    return <div className="container mt-5"><h2>Loading versions...</h2></div>;
  }

  const cleanResumeData = (resume) => {
    // Create a copy without MongoDB's _id field to avoid conflicts
    const cleaned = { ...resume };
    delete cleaned._id;
    delete cleaned.uuid;
    delete cleaned.date_created;
    delete cleaned.date_updated;
    return cleaned;
  };

  const handleCreateInitialVersion = async () => {
    // Get current resume to create first version
    try {
      const response = await ResumesAPI.get(id);
      const resumeData = cleanResumeData(response.data || response);

      const versionName = prompt('Enter name for this version:', 'Version 1 - Original');
      if (!versionName) return;

      await ResumesAPI.createVersion(id, {
        name: versionName.trim(),
        description: 'Initial version snapshot',
        resume_data: resumeData,
      });

      alert('Version created successfully!');
      // Refresh versions list
      const versionsResponse = await ResumesAPI.getVersions(id);
      setVersions(versionsResponse.data || versionsResponse);
    } catch (err) {
      alert('Failed to create version: ' + err.message);
      console.error('Error creating initial version:', err);
    }
  };

  return (
    <div className="version-management-page">
      <div className="container mt-5">
        {error && <div className="alert alert-danger mb-4">{error}</div>}

        <div className="version-management-header">
          <div className="header-content">
            <h1>Resume Version Management</h1>
            <p className="header-subtitle">
              Create, compare, and manage multiple resume versions for different job applications
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleCreateInitialVersion} className="btn btn-primary">
              💾 Save Version
            </button>
            <button onClick={() => navigate(`/resumes/edit/${id}`)} className="btn btn-outline-secondary">
              ← Back to Editor
            </button>
          </div>
        </div>

        <div className="version-management-layout">
        <div className="versions-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Resume Versions ({versions.length})</h3>
            <button onClick={handleCreateInitialVersion} className="btn btn-sm btn-primary" title="Create a new version from current resume">
              {versions.length === 0 ? '+ Create First Version' : '+ Save Current as Version'}
            </button>
          </div>
          <p className="text-muted">Select up to 2 versions to compare</p>
          <div className="versions-container">
            {versions.map((version) => (
              <div
                key={version._id}
                className={`version-item`}
              >
                <div className="version-checkbox">
                  <input
                    type="checkbox"
                    id={`version-${version._id}`}
                    checked={selectedVersions.includes(version._id)}
                    onChange={() => handleVersionSelect(version._id)}
                    disabled={selectedVersions.length === 2 && !selectedVersions.includes(version._id)}
                  />
                </div>
                <div className="version-info">
                  <h4>{version.name}</h4>
                  <p className="version-description">{version.description}</p>
                  <p className="version-date">
                    Created: {new Date(version.date_created).toLocaleString()}
                  </p>
                  {version.job_linked && (
                    <p className="version-job">📌 Linked to: {version.job_linked}</p>
                  )}
                </div>
                <div className="version-actions">
                  <button
                    onClick={() => handleRestore(version._id)}
                    className="btn btn-sm btn-success"
                    title="Restore this version"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleRename(version._id)}
                    className="btn btn-sm btn-secondary"
                    title="Rename this version"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleCreateFromVersion(version._id)}
                    className="btn btn-sm btn-info"
                    title="Create a copy of this version"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleLinkJob(version._id)}
                    className="btn btn-sm btn-warning"
                    title="Link this version to a job posting"
                  >
                    Link Job
                  </button>
                  <button
                    onClick={() => handleDelete(version._id)}
                    className="btn btn-sm btn-danger"
                    title="Delete this version"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="version-comparison">
          <h3>Version Comparison</h3>
          {selectedVersions.length === 0 ? (
            <div className="alert alert-info">
              Select 2 versions above to compare side-by-side
            </div>
          ) : selectedVersions.length === 1 ? (
            <div className="alert alert-warning">
              Select one more version to compare
            </div>
          ) : (
            <>
              <div className="comparison-controls mb-3">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="btn btn-primary"
                >
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </button>
                <button
                  onClick={handleMergeVersions}
                  className="btn btn-info"
                  title="Merge selected versions into a new version"
                >
                  Merge Versions
                </button>
              </div>
              {showComparison && (
                <VersionComparison
                  version1={versions.find((v) => v._id === selectedVersions[0])}
                  version2={versions.find((v) => v._id === selectedVersions[1])}
                />
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
