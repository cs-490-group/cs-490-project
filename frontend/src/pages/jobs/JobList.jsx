import React, { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import JobForm from "./JobForm";
import JobPipeline from "./JobPipeline";
import JobCard from "./JobCard";
import { DeadlineCalendar, DeadlineReminderModal } from "./DeadlineComponents";
import { MaterialsModal, MaterialsAnalytics } from "./MaterialsTracking";
import JobStatistics from "./JobStatistics";
import PerformanceDashboard from "./PerformanceDashboard";
import FloatingDeadlineWidget from "./FloatingDeadlineWidget";
import JobsAPI from "../../api/jobs";
import ProfilesAPI from "../../api/profiles";
import { Container, Spinner } from 'react-bootstrap';
import JobListHeader from "./JobListHeader";
import SettingsModal from "./SettingsModal";
import FilterBar from "./FilterBar";
import BulkActionsBar from "./BulkActionsBar";
import JobDetailsModal from "./JobDetailsModal";
import { useJobFilters } from "./hooks/useJobFilters";
import { useJobOperations } from "./hooks/useJobOperations";

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [view, setView] = useState("dashboard");
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [reminderJob, setReminderJob] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(parseInt(localStorage.getItem('autoArchiveDays')) || 90);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(localStorage.getItem('autoArchiveEnabled') === 'true');
  const [undoStack, setUndoStack] = useState([]);
  const [showFloatingWidget, setShowFloatingWidget] = useState(
    localStorage.getItem('showDeadlineWidget') !== 'false'
  );

  const sensors = useSensors(useSensor(PointerSensor));
  const stages = ["Interested", "Applied", "Screening", "Interview", "Offer", "Rejected"];

  const {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    industryFilter, setIndustryFilter,
    locationFilter, setLocationFilter,
    jobTypeFilter, setJobTypeFilter,
    salaryFilter, setSalaryFilter,
    sortBy, setSortBy,
    clearAllFilters,
    sortedJobs,
    groupedJobs
  } = useJobFilters(jobs, stages, showArchived);

  const {
    addJob,
    updateJob,
    deleteJob,
    archiveJob,
    restoreJob,
    restoreDeletedJob,
    loadJobs,
    checkAutoArchive
  } = useJobOperations(setJobs, setSelectedJob, setSelectedJobIds, setUndoStack, jobs, autoArchiveDays, autoArchiveEnabled);

  useEffect(() => {
    loadJobs(setLoading);
  }, []);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await ProfilesAPI.get();
        if (response?.data?.email) {
          setUserEmail(response.data.email);
        }
      } catch (error) {
        console.error("Failed to fetch user email:", error);
      }
    };
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (autoArchiveEnabled) {
      checkAutoArchive();
    }
  }, [jobs, autoArchiveEnabled, autoArchiveDays]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!active || !over) return;

    const activeJob = jobs.find((j) => j.id === active.id);
    if (!activeJob) return;

    let newStatus = activeJob.status;
    if (over.id.toString().startsWith("droppable-")) {
      newStatus = over.id.toString().replace("droppable-", "");
    } else {
      const overJob = jobs.find((j) => j.id === over.id);
      if (overJob) newStatus = overJob.status;
    }

    if (activeJob.status !== newStatus) {
      const now = new Date().toISOString();
      const updatedStatusHistory = [...activeJob.status_history, [newStatus, now]];
      const updatedJob = {
        ...activeJob,
        status: newStatus,
        updatedAt: now,
        status_history: updatedStatusHistory,
        statusHistory: updatedStatusHistory.map(([status, timestamp]) => ({ status, timestamp }))
      };
      setJobs(jobs.map((j) => (j.id === activeJob.id ? updatedJob : j)));

      try {
        await JobsAPI.update(activeJob.id, {status: newStatus, status_history: updatedStatusHistory});
      } catch (error) {
        console.error("Failed to update job status:", error);
        loadJobs();
      }
    }
  };

  const toggleJobSelection = (id) => {
    setSelectedJobIds(prev =>
      prev.includes(id) ? prev.filter(jid => jid !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedJobIds(sortedJobs.map(j => j.id));
  };

  const clearSelection = () => setSelectedJobIds([]);

  const bulkArchive = async () => {
    if (selectedJobIds.length === 0) {
      alert("Please select jobs to archive");
      return;
    }
    const reason = prompt(`Archive ${selectedJobIds.length} job(s)?\n\nOptional reason:`);
    if (reason === null) return;

    try {
      for (const id of selectedJobIds) {
        await archiveJob(id, reason, true);
      }
      alert(`✅ Successfully archived ${selectedJobIds.length} job(s)`);
      setSelectedJobIds([]);
      loadJobs();
    } catch (error) {
      alert("Some jobs failed to archive. Please try again.");
    }
  };

  const bulkDelete = async () => {
    if (selectedJobIds.length === 0) {
      alert("Please select jobs to delete");
      return;
    }
    if (!window.confirm(`Permanently delete ${selectedJobIds.length} job(s)? This cannot be undone!`)) return;

    try {
      for (const id of selectedJobIds) {
        await JobsAPI.delete(id);
      }
      setJobs(jobs.filter(j => !selectedJobIds.includes(j.id)));
      alert(`✅ Successfully deleted ${selectedJobIds.length} job(s)`);
      setSelectedJobIds([]);
    } catch (error) {
      alert("Some jobs failed to delete. Please try again.");
    }
  };

  const bulkSetDeadline = async () => {
    if (selectedJobIds.length === 0) {
      alert("Please select jobs to set deadline");
      return;
    }
    const newDeadline = prompt(`Set deadline for ${selectedJobIds.length} selected job(s) (YYYY-MM-DD):`);
    if (!newDeadline) return;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(newDeadline)) {
      alert("Invalid date format. Please use YYYY-MM-DD");
      return;
    }

    try {
      for (const id of selectedJobIds) {
        const job = jobs.find(j => j.id === id);
        if (job) await JobsAPI.update(id, { deadline: newDeadline });
      }
      setJobs(jobs.map(j => selectedJobIds.includes(j.id) ? { ...j, deadline: newDeadline } : j));
      alert(`✅ Deadline updated for ${selectedJobIds.length} job(s)`);
      setSelectedJobIds([]);
    } catch (error) {
      console.error("Failed to set bulk deadline:", error);
      alert("Some jobs failed to update. Please try again.");
    }
  };

  const saveAutoArchiveSettings = () => {
    localStorage.setItem('autoArchiveDays', autoArchiveDays.toString());
    localStorage.setItem('autoArchiveEnabled', autoArchiveEnabled.toString());
    setShowSettings(false);
    alert('✅ Auto-archive settings saved');
  };

  const toggleFloatingWidget = () => {
    const newValue = !showFloatingWidget;
    setShowFloatingWidget(newValue);
    localStorage.setItem('showDeadlineWidget', String(newValue));
  };

  const activeJob = jobs.find((j) => j.id === activeId);

  if (loading) {
    return (
      <div className="dashboard-gradient min-vh-100 py-4">
        <Container>
          <h1 className="text-center text-white fw-bold mb-5 display-4">Jobs</h1>
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="light" className="mb-3" />
            <p className="text-white fs-5">Loading Jobs data...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "100%", margin: "0 auto" }}>
      <JobListHeader
        view={view}
        setView={setView}
        setEditingJob={setEditingJob}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
        setShowSettings={setShowSettings}
        showStatistics={showStatistics}
        setShowStatistics={setShowStatistics}
        showMaterials={showMaterials}
        setShowMaterials={setShowMaterials}
        showFloatingWidget={showFloatingWidget}
        toggleFloatingWidget={toggleFloatingWidget}
      />

      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        autoArchiveEnabled={autoArchiveEnabled}
        setAutoArchiveEnabled={setAutoArchiveEnabled}
        autoArchiveDays={autoArchiveDays}
        setAutoArchiveDays={setAutoArchiveDays}
        saveAutoArchiveSettings={saveAutoArchiveSettings}
      />

      {/* Performance Dashboard View */}
      {view === "dashboard" && (
        <PerformanceDashboard jobs={jobs} />
      )}

      {/* Pipeline View with Calendar, Statistics, and Materials */}
      {view === "pipeline" && (
        <>
          {showCalendar && <DeadlineCalendar jobs={jobs.filter(j => !j.archived)} />}
          {showStatistics && <JobStatistics jobs={jobs} />}
          {showMaterials && <MaterialsAnalytics />}
        </>
      )}

      <BulkActionsBar
        view={view}
        selectedJobIds={selectedJobIds}
        bulkSetDeadline={bulkSetDeadline}
        bulkArchive={bulkArchive}
        bulkDelete={bulkDelete}
        clearSelection={clearSelection}
      />

      {view === "pipeline" && !showCalendar && !showStatistics && !showMaterials && (
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          industryFilter={industryFilter}
          setIndustryFilter={setIndustryFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          jobTypeFilter={jobTypeFilter}
          setJobTypeFilter={setJobTypeFilter}
          salaryFilter={salaryFilter}
          setSalaryFilter={setSalaryFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          clearAllFilters={clearAllFilters}
          selectAllVisible={selectAllVisible}
          showArchived={showArchived}
          stages={stages}
          sortedJobsLength={sortedJobs.length}
        />
      )}

      {view === "form" && (
        <JobForm
          addJob={addJob}
          editJob={editingJob ? { ...editingJob, submit: updateJob } : null}
          cancelEdit={() => {
            setView("dashboard");
            setEditingJob(null);
            window.location.reload();
          }}
        />
      )}

      {view === "pipeline" && !showCalendar && !showStatistics && !showMaterials && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedJobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "20px" }}>
              {stages
                .filter(stage => statusFilter === "All" || stage === statusFilter)
                .map((stage) => (
                  <div key={stage} style={{ minWidth: "320px", maxWidth: "320px" }}>
                    <JobPipeline
                      stage={stage}
                      jobs={groupedJobs[stage]}
                      onView={(job) => setSelectedJob(job)}
                      onEdit={(job) => {
                        setEditingJob(job);
                        setView("form");
                      }}
                      onDelete={deleteJob}
                      onArchive={archiveJob}
                      onRestore={restoreJob}
                      activeId={activeId}
                      onSelect={!showArchived ? toggleJobSelection : null}
                      selectedJobIds={selectedJobIds}
                    />
                  </div>
                ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeJob && (
              <div style={{ cursor: "grabbing", width: "300px" }}>
                <JobCard job={activeJob} onView={() => {}} onEdit={() => {}} onDelete={() => {}} isOverlay={true} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <JobDetailsModal
        selectedJob={selectedJob}
        setSelectedJob={setSelectedJob}
        setReminderJob={setReminderJob}
        updateJob={updateJob}
        archiveJob={archiveJob}
        restoreJob={restoreJob}
        deleteJob={deleteJob}
        setEditingJob={setEditingJob}
        setView={setView}
      />

      {reminderJob && (
        <DeadlineReminderModal
          job={reminderJob}
          userEmail={userEmail}
          onClose={() => setReminderJob(null)}
          onSave={(updatedJob) => {
            updateJob(updatedJob);
            setReminderJob(null);
          }}
        />
      )}
      
      {/* Floating Deadline Widget - appears on all job views */}
      {showFloatingWidget && <FloatingDeadlineWidget jobs={jobs} onJobClick={(job) => setSelectedJob(job)} />}
    </div>
  );
}