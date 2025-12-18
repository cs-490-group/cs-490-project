import React, { useState } from "react";

// Helper function to safely get IDs
const safeId = (obj, fallback = "") => {
  if (!obj) return fallback;
  // Prefer _id for packages/jobs as that's what MongoDB uses
  return obj._id || obj.uuid || obj.id || fallback;
};

// Quality Score Badge Component
const ScoreBadge = ({ score }) => {
  let bgClass = "bg-danger";
  let label = "Needs Work";
  
  if (score >= 85) {
    bgClass = "bg-success";
    label = "Excellent";
  } else if (score >= 70) {
    bgClass = "bg-warning";
    label = "Good";
  }
  
  return (
    <span className={`badge ${bgClass} rounded-pill`}>
      {score}/100 - {label}
    </span>
  );
};

// Analysis Modal Component
const AnalysisModal = ({ show, onClose, analysis, packageName, onReanalyze }) => {
  if (!show) return null;
  
  const getPriorityBadge = (priority) => {
    const colors = {
      high: "danger",
      medium: "warning",
      low: "info"
    };
    return <span className={`badge bg-${colors[priority]}`}>{priority}</span>;
  };
  
  const canSubmit = analysis.overallScore >= (analysis.minimumThreshold || 70);
  
  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Quality Analysis: {packageName}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            {/* Overall Score with Submission Warning */}
            <div className={`card mb-3 ${!canSubmit ? 'border-danger' : 'border-success'}`}>
              <div className="card-body text-center">
                <h2 className="display-3 mb-2">
                  <ScoreBadge score={analysis.overallScore} />
                </h2>
                <p className="text-muted mb-2">
                  {analysis.comparisonToAverage > 0 ? "+" : ""}
                  {analysis.comparisonToAverage}% vs. your average
                </p>
                
                {!canSubmit && (
                  <div className="alert alert-danger mt-3 mb-0">
                    <strong>⚠️ Score Below Threshold</strong>
                    <p className="mb-0 small">
                      Minimum score of {analysis.minimumThreshold || 70} required. 
                      Improve your application before submitting.
                    </p>
                  </div>
                )}
                
                {canSubmit && (
                  <div className="alert alert-success mt-3 mb-0">
                    <strong>✅ Ready to Submit</strong>
                    <p className="mb-0 small">
                      Your application meets the quality threshold.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="card mb-3">
              <div className="card-header">
                <strong>Score Breakdown</strong>
              </div>
              <div className="card-body">
                {Object.entries(analysis.breakdown || {}).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small>{key.replace(/([A-Z])/g, ' $1').trim()}</small>
                      <small><strong>{value}/100</strong></small>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div
                        className={`progress-bar ${
                          value >= 85 ? "bg-success" : value >= 70 ? "bg-warning" : "bg-danger"
                        }`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Missing Keywords */}
            {analysis.missingKeywords?.length > 0 && (
              <div className="card mb-3">
                <div className="card-header">
                  <strong>Missing Keywords</strong>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((keyword, idx) => (
                      <span key={idx} className="badge bg-secondary">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Formatting Issues */}
            {analysis.formattingIssues?.length > 0 && (
              <div className="card mb-3">
                <div className="card-header">
                  <strong>Formatting Issues</strong>
                </div>
                <div className="card-body">
                  <ul className="mb-0">
                    {analysis.formattingIssues.map((issue, idx) => (
                      <li key={idx} className="small text-muted">{issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Improvement Suggestions */}
            <div className="card">
              <div className="card-header">
                <strong>Improvement Suggestions</strong>
              </div>
              <div className="card-body">
                {analysis.suggestions?.map((suggestion, idx) => (
                  <div key={idx} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        {getPriorityBadge(suggestion.priority)}
                        <span className="ms-2 fw-bold">{suggestion.category}</span>
                      </div>
                    </div>
                    <p className="mb-1 small"><strong>Issue:</strong> {suggestion.issue}</p>
                    <p className="mb-0 small text-success">
                      <strong>Action:</strong> {suggestion.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            {onReanalyze && (
              <button className="btn btn-primary" onClick={onReanalyze}>
                Re-analyze After Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Job Selection Modal
const JobSelectionModal = ({ show, onClose, jobs, onSelect }) => {
  if (!show) return null;
  
  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select Job to Analyze Against</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="list-group">
              {jobs.map((job, idx) => {
                const jobId = safeId(job, `job-${idx}`);
                const companyName = typeof job.company === "string"
                  ? job.company
                  : job.company?.name || "Unknown Company";
                
                return (
                  <button
                    key={jobId}
                    className="list-group-item list-group-item-action"
                    onClick={() => onSelect(job)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">{job.title}</h6>
                      <small className="text-muted">{job.status || "Active"}</small>
                    </div>
                    <p className="mb-1 small">{companyName}</p>
                    <small className="text-muted">{job.location}</small>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PackagesTab({
  packages,
  resumes,
  coverLetters,
  jobs,
  checklist,
  selectedJobIds,
  pkgName,
  pkgDescription,
  pkgResume,
  pkgCoverLetter,
  pkgPortfolioIds,
  editingPackageId,
  setPkgName,
  setPkgDescription,
  setPkgResume,
  setPkgCoverLetter,
  setPkgPortfolioIds,
  setBulkPackageId,
  bulkPackageId,
  resetPackageForm,
  startEditPackage,
  handleSavePackage,
  handleDeletePackage,
  handleUsePackage,
  bulkApply,
  toggleJob,
  applicationWorkflowAPI
}) {
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showJobSelectionModal, setShowJobSelectionModal] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [analyzingPackage, setAnalyzingPackage] = useState(null);
  const [selectedJobForAnalysis, setSelectedJobForAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  const handleAnalyzeClick = (pkg) => {
    setAnalyzingPackage(pkg);
    setShowJobSelectionModal(true);
    setAnalysisError(null);
  };
  
  const performAnalysis = async (pkg, job) => {
    setIsAnalyzing(true);
    
    try {
      const packageId = safeId(pkg);
      const jobId = safeId(job);
      
      console.log("📦 Sending package ID:", packageId);
      console.log("💼 Sending job ID:", jobId);
      
      const response = await applicationWorkflowAPI.analyzePackageQuality(
        packageId,
        jobId
      );
      
      setCurrentAnalysis({
        ...response.data,
        packageName: pkg.name || "(Unnamed)",
        jobTitle: job.title
      });
      setSelectedJobForAnalysis(job);
      setShowAnalysisModal(true);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError(
        error.response?.data?.detail || "Failed to analyze package. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleJobSelect = async (job) => {
    setShowJobSelectionModal(false);
    await performAnalysis(analyzingPackage, job);
  };
  
  const handleReanalyze = async () => {
    if (analyzingPackage && selectedJobForAnalysis) {
      setShowAnalysisModal(false);
      await performAnalysis(analyzingPackage, selectedJobForAnalysis);
    }
  };
  
  return (
    <>
      {/* Loading/Error Toast */}
      {(isAnalyzing || analysisError) && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className={`alert ${analysisError ? "alert-danger" : "alert-info"} shadow`}>
            {isAnalyzing ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Analyzing...</span>
                </div>
                Analyzing package quality...
              </div>
            ) : (
              <div>
                {analysisError}
                <button
                  className="btn-close float-end"
                  onClick={() => setAnalysisError(null)}
                ></button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      <JobSelectionModal
        show={showJobSelectionModal}
        onClose={() => setShowJobSelectionModal(false)}
        jobs={jobs}
        onSelect={handleJobSelect}
      />
      
      <AnalysisModal
        show={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        analysis={currentAnalysis || {}}
        packageName={currentAnalysis?.packageName || ""}
        onReanalyze={handleReanalyze}
      />
      
      {/* Package Cards + Form */}
      <div className="row g-4 mb-4">
        {/* Left: Package cards */}
        <div className="col-lg-7">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5>Your Application Packages</h5>
            <small className="text-muted">{packages.length} total</small>
          </div>

          {packages.length === 0 ? (
            <div className="border rounded p-4 text-center text-muted">
              No packages yet.
            </div>
          ) : (
            <div className="row g-3">
              {packages.map((pkg, i) => {
                const id = safeId(pkg, `pkg-${i}`);
                const minimumThreshold = 70;
                const isLocked = pkg.lastScore !== undefined && pkg.lastScore !== null && pkg.lastScore < minimumThreshold;
                const needsAnalysis = !pkg.lastScore && pkg.lastScore !== 0;

                return (
                  <div key={id} className="col-md-6">
                    <div className={`card shadow-sm h-100 ${isLocked ? 'border-danger' : ''}`}>
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="card-title">{pkg.name || "(Unnamed)"}</h6>
                          {isLocked && (
                            <span className="badge bg-danger" title="Quality score below threshold">
                              🔒 Locked
                            </span>
                          )}
                          {needsAnalysis && (
                            <span className="badge bg-warning text-dark" title="Not analyzed yet">
                              ⚠️ Not Analyzed
                            </span>
                          )}
                        </div>
                        <small className="text-muted">{pkg.description}</small>

                        <ul className="small ps-3 mt-2 mb-3">
                          <li>Resume: {pkg.resume_id ? "Attached" : "None"}</li>
                          <li>Cover Letter: {pkg.cover_letter_id ? "Attached" : "None"}</li>
                          <li>Portfolio Links: {pkg.portfolio_links?.length || 0}</li>
                        </ul>

                        {isLocked && (
                          <div className="alert alert-danger py-1 px-2 mb-2 small">
                            <strong>⚠️ Below Threshold</strong><br/>
                            Score: {pkg.lastScore}/100. Minimum: {minimumThreshold}
                          </div>
                        )}

                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">
                              Used {pkg.usage_count || 0}×
                            </small>
                            {pkg.lastScore !== undefined && pkg.lastScore !== null && (
                              <ScoreBadge score={pkg.lastScore} />
                            )}
                          </div>

                          <div className="btn-group btn-group-sm w-100">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => startEditPackage(pkg)}
                              title="Edit package"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-info"
                              onClick={() => handleAnalyzeClick(pkg)}
                              title="Analyze quality"
                            >
                              Analyze
                            </button>
                            <button
                              className={`btn ${isLocked ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                              onClick={() => handleUsePackage(id)}
                              title={isLocked ? "Package locked due to low quality score" : "Use package"}
                              disabled={isLocked}
                            >
                              {isLocked ? '🔒 Locked' : 'Use'}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeletePackage(id)}
                              title="Delete package"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Create/Edit Form */}
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5>{editingPackageId ? "Edit Package" : "Create Package"}</h5>

              <div className="row g-2 mt-2">
                <input
                  className="form-control"
                  placeholder="Package name"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                />

                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Description"
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                />

                <label className="form-label small mt-2">Resume</label>
                <select
                  className="form-select form-select-sm"
                  value={pkgResume}
                  onChange={(e) => setPkgResume(e.target.value)}
                  aria-label="Select resume"
                >
                  <option value="">Select resume</option>
                  {resumes.map((r, i) => (
                    <option key={i} value={safeId(r)}>
                      {r.title || r.name}
                    </option>
                  ))}
                </select>

                <label className="form-label small mt-2">Cover Letter</label>
                <select
                  className="form-select form-select-sm"
                  value={pkgCoverLetter}
                  onChange={(e) => setPkgCoverLetter(e.target.value)}
                  aria-label="Select cover letter"
                >
                  <option value="">None</option>
                  {coverLetters.map((c, i) => (
                    <option key={i} value={safeId(c)}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>

                <label className="form-label small mt-2">
                  Portfolio Links (one per line)
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="https://github.com/portfolio&#10;https://dribbble.com/..."
                  value={pkgPortfolioIds}
                  onChange={(e) => setPkgPortfolioIds(e.target.value)}
                />

                <div className="d-flex justify-content-between mt-3">
                  {editingPackageId && (
                    <button
                      type="button"
                      className="btn btn-link text-muted"
                      onClick={resetPackageForm}
                    >
                      Cancel edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary ms-auto"
                    onClick={handleSavePackage}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Apply Table */}
      <div className="border rounded p-3">
        <div className="d-flex justify-content-between mb-2">
          <h5>Bulk Apply</h5>
          <small>Select jobs → choose package → apply</small>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <select
              className="form-select"
              value={bulkPackageId}
              onChange={(e) => setBulkPackageId(e.target.value)}
              aria-label="Select package for bulk apply"
            >
              <option value="">Select Package</option>
              {packages.map((p, i) => (
                <option key={i} value={safeId(p)}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <button className="btn btn-success" onClick={bulkApply}>
              Apply Selected Jobs
            </button>
          </div>
        </div>

        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th></th>
              <th>Job</th>
              <th style={{ width: "260px" }}>Checklist</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job, i) => {
              const id = safeId(job, `job-${i}`);
              const c = checklist[id] || {};

              return (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedJobIds.includes(id)}
                      onChange={() => toggleJob(id)}
                    />
                  </td>

                  <td>
                    <strong>
                      {job.title} @ {
                        typeof job.company === "string"
                        ? job.company
                        : job.company?.name ||
                          job.company?.industry ||
                          job.company?.location ||
                          "Unknown Company"
                        }
                    </strong>
                    <br />
                    <small className="text-muted">{job.location}</small>
                  </td>

                  <td>
                    {c.package ? "✅ Package" : "⬜ Package"} &nbsp;
                    {c.scheduled ? "✅ Scheduled" : "⬜ Scheduled"} &nbsp;
                    {c.submitted ? "✅ Submitted" : "⬜ Submitted"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}