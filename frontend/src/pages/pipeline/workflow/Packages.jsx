import React from "react";
import { safeId } from "./helpers";

export default function PackagesTab({
  packages,
  resumes,
  coverLetters,
  jobs,
  checklist,
  selectedJobIds,

  // Form state
  pkgName,
  pkgDescription,
  pkgResume,
  pkgCoverLetter,
  pkgPortfolioIds, // now stores portfolio LINKS (newline-separated string)
  editingPackageId,

  // Setters
  setPkgName,
  setPkgDescription,
  setPkgResume,
  setPkgCoverLetter,
  setPkgPortfolioIds,
  setBulkPackageId,

  // Bulk
  bulkPackageId,

  // Actions
  resetPackageForm,
  startEditPackage,
  handleSavePackage,
  handleDeletePackage,
  handleUsePackage,
  bulkApply,
  toggleJob
}) {
  return (
    <>
      {/* ------------ PACKAGE CARDS + FORM -------------- */}
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
                return (
                  <div key={id} className="col-md-6">
                    <div className="card shadow-sm h-100">
                      <div className="card-body d-flex flex-column">
                        <h6 className="card-title">{pkg.name || "(Unnamed)"}</h6>
                        <small className="text-muted">{pkg.description}</small>

                        <ul className="small ps-3 mt-2 mb-3">
                          <li>Resume: {pkg.resume_id ? "Attached" : "None"}</li>
                          <li>Cover Letter: {pkg.cover_letter_id ? "Attached" : "None"}</li>
                          <li>Portfolio Links: {pkg.portfolio_links?.length || 0}</li>
                        </ul>

                        <div className="mt-auto d-flex justify-content-between">
                          <small className="text-muted">
                            Used {pkg.usage_count || 0}×
                          </small>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => startEditPackage(pkg)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleUsePackage(id)}
                            >
                              Use
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeletePackage(id)}
                            >
                              Delete
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

              <form onSubmit={handleSavePackage} className="row g-2 mt-2">
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
                  placeholder="https://github.com/portfolio\nhttps://dribbble.com/..."
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
                  <button type="submit" className="btn btn-primary ms-auto">
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ------------ BULK APPLY TABLE -------------- */}
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

