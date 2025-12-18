import React from "react";
import { safeId } from "./helpers";
import ApplicationWorkflowAPI from "../../../api/applicationWorkflow";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import JobsAPI from "../../../api/jobs";


export default function TemplatesTab({
  templates,

  templateTitle,
  templateCategory,
  templateBody,
  templatePreview,

  setTemplateTitle,
  setTemplateCategory,
  setTemplateBody,
  setTemplatePreview,

  createTemplate,
  deleteTemplate
}) {
  return (
    <div className="row g-3">
      {/* Left — Create template */}
      <div className="col-lg-5">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5>Create Template</h5>

            <form onSubmit={createTemplate}>
              <label className="form-label small">Title</label>
              <input
                className="form-control form-control-sm"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
              />

              <label className="form-label small mt-2">Category</label>
              <select
                className="form-select form-select-sm"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                aria-label="Select template category"
              >
                <option value="screening_questions">Screening Questions</option>
                <option value="why_company">Why Company</option>
                <option value="why_role">Why Role</option>
                <option value="strengths">Strengths</option>
                <option value="other">Other</option>
              </select>

              <label className="form-label small mt-2">Content</label>
              <textarea
                className="form-control form-control-sm"
                rows={5}
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
              />

              <button className="btn btn-primary btn-sm mt-3">Save</button>
            </form>
          </div>
        </div>
      </div>

      {/* Right — Saved templates */}
      <div className="col-lg-7">
        <h5 className="mb-2">Saved Templates</h5>

        {templates.length === 0 ? (
          <div className="border rounded p-3 text-muted">No templates yet.</div>
        ) : (
          <div className="list-group">
            {templates.map((t, i) => (
              <div
                key={i}
                className="list-group-item d-flex justify-content-between"
              >
                <div>
                  <strong>{t.name}</strong>
                  <span className="badge bg-light text-secondary ms-2">
                    {t.category}
                  </span>
                  <br />
                  <small className="text-muted">
                    Used {t.usage_count || 0}×
                  </small>
                </div>

                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setTemplatePreview(t.content)}
                  >
                    Use
                  </button>
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => deleteTemplate(safeId(t))}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {templatePreview && (
          <div className="mt-3">
            <h6>Preview</h6>
            <pre className="alert alert-secondary small">{templatePreview}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
