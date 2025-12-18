import React, { useState, useEffect } from "react";
import ApplicationWorkflowAPI from "../../../api/applicationWorkflow";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import { safeId } from "./helpers";

export default function AutomationRules() {
  const [rules, setRules] = useState([]);
  const [packages, setPackages] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState({
    name: "",
    trigger: "on_job_created",
    rule_type: "auto_assign_materials",
    conditions: {},
    actions: { portfolio_ids: [] }
  });

  /* ---------------------- LOAD EVERYTHING ---------------------- */
  useEffect(() => {
    loadRules();
    loadPackages();
    loadResumes();
    loadCoverLetters();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await ApplicationWorkflowAPI.getAutomationRules();
      setRules(res.data || []);
    } catch (err) {
      console.error("Failed to load rules:", err);
    }
    setLoading(false);
  }

  async function loadPackages() {
    try {
      const res = await ApplicationWorkflowAPI.getPackages();
      setPackages(res.data || []);
    } catch (err) {
      console.error("Failed to load packages:", err);
    }
  }

  async function loadResumes() {
    try {
      const res = await ResumesAPI.getAll();
      setResumes(res.data || []);
    } catch (err) {
      console.error("Failed to load resumes:", err);
    }
  }

  async function loadCoverLetters() {
    try {
      const res = await CoverLetterAPI.getAll();
      setCoverLetters(res.data || []);
    } catch (err) {
      console.error("Failed to load cover letters:", err);
    }
  }

  function updateForm(field, value) {
    setForm({ ...form, [field]: value });
  }

  function updateAction(field, value) {
    setForm({
      ...form,
      actions: {
        ...form.actions,
        [field]: value
      }
    });
  }

  /* ---------------------- CREATE RULE ---------------------- */
  async function submitRule() {
    const payload = {
      name: form.name,
      trigger: form.trigger,
      rule_type: form.rule_type,
      conditions: form.conditions,
      actions: form.actions
    };

    try {
      await ApplicationWorkflowAPI.createAutomationRule(payload);
      setShowCreate(false);
      await loadRules();
    } catch (err) {
      console.error("Rule creation failed:", err);
      alert("Failed to create rule.");
    }
  }

  /* ---------------------- TOGGLE RULE ---------------------- */
  async function toggleRule(id, enabled) {
    try {
      await ApplicationWorkflowAPI.toggleAutomationRule(id, enabled);
      await loadRules();
    } catch (err) {
      console.error("Toggle rule failed:", err);
    }
  }

  /* ---------------------- DELETE RULE ---------------------- */
  async function removeRule(id) {
    try {
      await ApplicationWorkflowAPI.deleteAutomationRule(id);
      await loadRules();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  /* ---------------------- UI ---------------------- */
  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>⚙️ Automation Rules</h2>

      {/* Existing rules */}
      <div style={{ marginTop: 20 }}>
        {rules.length === 0 ? (
          <p>No automation rules yet.</p>
        ) : (
          rules.map(rule => (
            <div
              key={rule._id}
              style={{
                border: "1px solid #ddd",
                padding: 15,
                marginBottom: 10,
                borderRadius: 8
              }}
            >
              <h4>{rule.name}</h4>
              <p>
                <strong>Trigger:</strong> {rule.trigger} <br />
                <strong>Type:</strong> {rule.rule_type}
              </p>

              <div className="btn-group">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => toggleRule(rule._id, !rule.enabled)}
                >
                  {rule.enabled ? "Disable" : "Enable"}
                </button>

                <button
                  className="btn btn-sm btn-danger ms-2"
                  onClick={() => removeRule(rule._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Rule Button */}
      <button
        className="btn btn-success"
        style={{ marginTop: 20 }}
        onClick={() => setShowCreate(!showCreate)}
      >
        {showCreate ? "Cancel" : "➕ Add Automation Rule"}
      </button>

      {/* Create Form */}
      {showCreate && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 10,
            border: "1px solid #ccc"
          }}
        >
          <h3>Create Automation Rule</h3>

          {/* Rule Name */}
          <label className="form-label">Rule Name</label>
          <input
            className="form-control"
            value={form.name}
            onChange={e => updateForm("name", e.target.value)}
          />

          {/* Trigger */}
          <label className="form-label mt-3">Trigger</label>
          <select
            className="form-control"
            value={form.trigger}
            onChange={e => updateForm("trigger", e.target.value)}
            aria-label="Select trigger"
          >
            <option value="on_job_created">On Job Created</option>
            <option value="on_status_change">On Status Change</option>
          </select>

          {/* Rule Type */}
          <label className="form-label mt-3">Rule Type</label>
          <select
            className="form-control"
            value={form.rule_type}
            onChange={e => updateForm("rule_type", e.target.value)}
            aria-label="Select rule type"
          >
            <option value="auto_assign_materials">Auto Assign Materials</option>
            <option value="auto_create_package">Auto Create Package</option>
            <option value="auto_submit_application">Auto Submit</option>
            <option value="auto_schedule_application">Auto Schedule Application</option>
          </select>

          {/* Condition */}
          <label className="form-label mt-3">Condition: Company Contains</label>
          <input
            className="form-control"
            placeholder="ex: Google"
            onChange={e =>
              updateForm("conditions", {
                company_contains: e.target.value
              })
            }
          />

          {/* MATERIAL SELECTION (Assign + Package) */}
          {(form.rule_type === "auto_assign_materials" ||
            form.rule_type === "auto_create_package") && (
            <>
              <label className="form-label mt-3">Resume</label>
              <select
                className="form-control"
                onChange={e => updateAction("resume_id", e.target.value)}
                aria-label="Select resume"
              >
                <option value="">Select resume</option>
                {resumes.map(r => (
                  <option key={safeId(r)} value={safeId(r)}>
                    {r.title || r.name}
                  </option>
                ))}
              </select>

              <label className="form-label mt-3">Cover Letter</label>
              <select
                className="form-control"
                onChange={e => updateAction("cover_letter_id", e.target.value)}
                aria-label="Select cover letter"
              >
                <option value="">Select cover letter</option>
                {coverLetters.map(c => (
                  <option key={safeId(c)} value={safeId(c)}>
                    {c.title || c.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* PACKAGE SETTINGS (ONLY for auto_create_package) */}
          {form.rule_type === "auto_create_package" && (
            <>
              <label className="form-label mt-3">Portfolio Links</label>
              <textarea
                className="form-control"
                placeholder="One link per line"
                onChange={e =>
                  updateAction(
                    "portfolio_ids",
                    e.target.value
                      .split("\n")
                      .map(l => l.trim())
                      .filter(Boolean)
                  )
                }
              />

              <label className="form-label mt-3">Package Name</label>
              <input
                className="form-control"
                onChange={e => updateAction("package_name", e.target.value)}
              />

              <label className="form-label mt-3">Package Description</label>
              <textarea
                className="form-control"
                onChange={e =>
                  updateAction("package_description", e.target.value)
                }
              />
            </>
          )}

          {/* ⭐ PACKAGE DROPDOWN FOR auto_schedule_application */}
          {form.rule_type === "auto_schedule_application" && (
            <>
              <label className="form-label mt-3">Select Package to Schedule</label>
              <select
                className="form-control"
                onChange={e => updateAction("package_id", e.target.value)}
                aria-label="Select package to schedule"
              >
                <option value="">Select package</option>
                {packages.map(p => (
                  <option key={safeId(p)} value={safeId(p)}>
                    {p.name}
                  </option>
                ))}
              </select>

              <label className="form-label mt-3">Schedule Time (HH:MM)</label>
              <input
                className="form-control"
                placeholder="09:00"
                onChange={e => updateAction("schedule_time", e.target.value)}
              />
            </>
          )}

          <button className="btn btn-primary mt-4" onClick={submitRule}>
            Create Rule
          </button>
        </div>
      )}
    </div>
  );
}




