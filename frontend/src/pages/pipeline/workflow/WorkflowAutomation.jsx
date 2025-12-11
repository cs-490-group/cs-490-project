import React, { useEffect, useState } from "react";

import ApplicationWorkflowAPI from "../../../api/applicationWorkflow";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import JobsAPI from "../../../api/jobs";

// Subcomponents
import PackagesTab from "./Packages";
import SchedulesTab from "./Schedules";
import TemplatesTab from "./Templates";
import AutomationRules from "./AutomationRules";

import { safeId } from "./helpers";

export default function WorkflowAutomation() {
  /* --------------------------- STATE --------------------------- */
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("packages");

  const [jobs, setJobs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);

  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [checklist, setChecklist] = useState({});

  /* ---------- Package Form State ---------- */
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgName, setPkgName] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgResume, setPkgResume] = useState("");
  const [pkgCoverLetter, setPkgCoverLetter] = useState("");
  const [pkgPortfolioIds, setPkgPortfolioIds] = useState("");

  const [bulkPackageId, setBulkPackageId] = useState("");

  /* ---------- Schedule Form ---------- */
  const [scheduleJobId, setScheduleJobId] = useState("");
  const [schedulePackageId, setSchedulePackageId] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  /* ---------- Templates Form ---------- */
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateCategory, setTemplateCategory] = useState("screening_questions");
  const [templateBody, setTemplateBody] = useState("");
  const [templatePreview, setTemplatePreview] = useState("");

  /* --------------------------- LOAD DATA --------------------------- */
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);

      const [
        jobsRes,
        pkgRes,
        schedRes,
        tmplRes,
        resumesRes,
        coverRes
      ] = await Promise.all([
        JobsAPI.getAll(),
        ApplicationWorkflowAPI.getPackages(),
        ApplicationWorkflowAPI.getSchedules(),
        ApplicationWorkflowAPI.getTemplates(),
        ResumesAPI.getAll(),
        CoverLetterAPI.getAll()
      ]);

      setJobs(jobsRes.data || []);
      setPackages(pkgRes.data || []);
      setSchedules(schedRes.data || []);
      setTemplates(tmplRes.data || []);
      setResumes(resumesRes.data || []);
      setCoverLetters(coverRes.data || []);

      const chk = {};
      jobsRes.data.forEach((job, i) => {
        const id = safeId(job, `job-${i}`);
        chk[id] = {
          package: Boolean(job.application_package_id),
          scheduled: schedRes.data.some((s) => s.job_id === id),
          submitted:
            job.status === "APPLIED" ||
            job.status === "SUBMITTED" ||
            Boolean(job.submitted)
        };
      });
      setChecklist(chk);
    } catch (err) {
      console.error("Workflow load error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------- HELPERS --------------------------- */
  function toggleJob(id) {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function updateChecklist(jobIds, patch) {
    setChecklist((prev) => {
      const next = { ...prev };
      jobIds.forEach((id) => {
        next[id] = { ...(next[id] || {}), ...patch };
      });
      return next;
    });
  }

  /* -------------------------- PACKAGE ACTIONS --------------------------- */
  function resetPackageForm() {
    setEditingPackageId(null);
    setPkgName("");
    setPkgDescription("");
    setPkgResume("");
    setPkgCoverLetter("");
    setPkgPortfolioIds("");
  }

  function startEditPackage(pkg) {
    setEditingPackageId(safeId(pkg));
    setPkgName(pkg.name || "");
    setPkgDescription(pkg.description || "");
    setPkgResume(pkg.resume_id || "");
    setPkgCoverLetter(pkg.cover_letter_id || "");
    setPkgPortfolioIds(pkg.portfolio_ids?.join(",") || "");
  }

  async function handleSavePackage(e) {
    e.preventDefault();

    const payload = {
      name: pkgName || null,
      description: pkgDescription || null,
      resume_id: pkgResume,
      cover_letter_id: pkgCoverLetter || null,
      portfolio_ids: pkgPortfolioIds
        ? pkgPortfolioIds.split(",").map((x) => x.trim())
        : [],
      status: "draft"
    };

    try {
      if (editingPackageId) {
        await ApplicationWorkflowAPI.updatePackage(editingPackageId, payload);
      } else {
        await ApplicationWorkflowAPI.createPackage(payload);
      }
      resetPackageForm();
      loadAll();
    } catch (err) {
      console.error("Save package error:", err);
    }
  }

  async function handleDeletePackage(id) {
    if (!window.confirm("Delete this package?")) return;
    await ApplicationWorkflowAPI.deletePackage(id);
    loadAll();
  }

  async function handleUsePackage(id) {
    await ApplicationWorkflowAPI.markPackageUsed(id);
    loadAll();
  }

  async function bulkApply() {
    if (!bulkPackageId || selectedJobIds.length === 0) {
      return alert("Select package + jobs");
    }

    await ApplicationWorkflowAPI.bulkApply({
      job_ids: selectedJobIds,
      package_id: bulkPackageId
    });

    updateChecklist(selectedJobIds, {
      package: true,
      submitted: true
    });

    loadAll();
  }

  /* -------------------------- SCHEDULE ACTIONS --------------------------- */
  async function createSchedule(e) {
    e.preventDefault();

    const payload = {
      job_id: scheduleJobId,
      package_id: schedulePackageId,
      scheduled_time: new Date(scheduleTime).toISOString(),
      submission_method: "manual"
    };

    await ApplicationWorkflowAPI.createSchedule(payload);
    updateChecklist([scheduleJobId], { scheduled: true });

    setScheduleJobId("");
    setSchedulePackageId("");
    setScheduleTime("");

    loadAll();
  }

  async function cancelSchedule(id, job_id) {
    await ApplicationWorkflowAPI.cancelSchedule(id);
    updateChecklist([job_id], { scheduled: false });
    loadAll();
  }

  /* -------------------------- TEMPLATE ACTIONS --------------------------- */
  async function createTemplate(e) {
    e.preventDefault();

    await ApplicationWorkflowAPI.createTemplate({
      name: templateTitle,
      category: templateCategory,
      content: templateBody
    });

    setTemplateTitle("");
    setTemplateBody("");
    setTemplateCategory("screening_questions");

    loadAll();
  }

  async function deleteTemplate(id) {
    await ApplicationWorkflowAPI.deleteTemplate(id);
    loadAll();
  }

  /* -------------------------- RENDER --------------------------- */

  if (loading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="container py-4">
      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {["packages", "schedules", "templates", "rules"].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      {activeTab === "packages" && (
        <PackagesTab
          {...{
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
            bulkPackageId,
            editingPackageId,
            setPkgName,
            setPkgDescription,
            setPkgResume,
            setPkgCoverLetter,
            setPkgPortfolioIds,
            setBulkPackageId,
            resetPackageForm,
            startEditPackage,
            handleSavePackage,
            handleDeletePackage,
            handleUsePackage,
            bulkApply,
            toggleJob
          }}
        />
      )}

      {activeTab === "schedules" && (
        <SchedulesTab
          {...{
            schedules,
            jobs,
            packages,
            scheduleJobId,
            schedulePackageId,
            scheduleTime,
            setScheduleJobId,
            setSchedulePackageId,
            setScheduleTime,
            createSchedule,
            cancelSchedule
          }}
        />
      )}

      {activeTab === "templates" && (
        <TemplatesTab
          {...{
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
          }}
        />
      )}

      {/* ================= AUTOMATION RULES ================= */}
    {activeTab === "rules" && (
        <AutomationRules />
    )}

    </div>
  );
}
