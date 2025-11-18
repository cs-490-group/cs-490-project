import JobsAPI from "../../../api/jobs";

export function useJobOperations(setJobs, setSelectedJob, setSelectedJobIds, setUndoStack, jobs, autoArchiveDays, autoArchiveEnabled) {
  
  const loadJobs = async (setLoading) => {
    try {
      if (setLoading) setLoading(true);
      const res = await JobsAPI.getAll();
      
      const transformedJobs = (res.data || []).map(job => ({
        id: job._id,
        title: job.title,
        company: typeof job.company === 'string' ? job.company : job.company?.name || 'Unknown Company',
        companyData: job.company_data || null,
        location: job.location,
        salary: job.salary,
        url: job.url,
        deadline: job.deadline,
        industry: job.industry,
        job_type: job.job_type,
        jobType: job.job_type,
        description: job.description,
        status: job.status,
        createdAt: job.date_created || job.createdAt,
        updatedAt: job.date_updated || job.updatedAt,
        status_history: job.status_history || [],
        statusHistory: (job.status_history || []).map(([status, timestamp]) => ({
          status,
          timestamp
        })),
        notes: job.notes,
        contacts: job.contacts,
        salary_notes: job.salary_notes,
        salaryNotes: job.salary_notes,
        interview_notes: job.interview_notes,
        interviewNotes: job.interview_notes,
        archived: job.archived || false,
        archiveReason: job.archive_reason,
        archiveDate: job.archive_date,
        reminderDays: job.reminderDays || 3,
        emailReminder: job.emailReminder !== false,
        reminderEmail: job.reminderEmail
      }));
      
      setJobs(transformedJobs);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      setJobs([]);
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const checkAutoArchive = async () => {
    const today = new Date();
    const jobsToArchive = jobs.filter(job => {
      if (job.archived) return false;
      if (!job.updatedAt && !job.createdAt) return false;
      
      const lastUpdate = new Date(job.updatedAt || job.createdAt);
      const daysSinceUpdate = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
      
      return daysSinceUpdate >= autoArchiveDays;
    });

    if (jobsToArchive.length > 0) {
      const shouldArchive = window.confirm(
        `${jobsToArchive.length} job(s) haven't been updated in ${autoArchiveDays}+ days. Auto-archive them now?`
      );
      
      if (shouldArchive) {
        for (const job of jobsToArchive) {
          await archiveJob(job.id, `Auto-archived after ${autoArchiveDays} days of inactivity`, true);
        }
      }
    }
  };

  const addJob = async (jobData) => {
    try {
      const backendData = {
        ...jobData,
        company: jobData.companyData || jobData.company
      };
      
      const res = await JobsAPI.add(backendData);

      if (res && res.data.job_id) {
        const newJob = {
          id: res.data.job_id,
          ...jobData,
          company: typeof jobData.company === 'string' ? jobData.company : jobData.company?.name || jobData.companyData?.name || 'Unknown Company',
          companyData: jobData.companyData,
          jobType: jobData.job_type,
          salaryNotes: jobData.salary_notes,
          interviewNotes: jobData.interview_notes,
          statusHistory: (jobData.status_history || []).map(([status, timestamp]) => ({ status, timestamp })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setJobs(prev => [...prev, newJob]);
      }
    } catch (error) {
      console.error("Failed to add job:", error);
      alert(error.response?.data?.detail || "Failed to add job. Please try again.");
    }
  };

  const updateJob = async (jobData) => {
    try {
      const { id, createdAt, updatedAt, statusHistory, jobType, salaryNotes, interviewNotes, companyData, ...backendData } = jobData;
      
      if (companyData) {
        backendData.company = companyData;
      }
      
      await JobsAPI.update(id, backendData);

      setJobs(prev => prev.map(job => {
        if (job.id === id) {
          return {
            ...job,
            ...jobData,
            updatedAt: new Date().toISOString()
          };
        }
        return job;
      }));

      setSelectedJob(null);
    } catch (error) {
      console.error("Failed to update job:", error);
      alert(error.response?.data?.detail || "Failed to update job. Please try again.");
      loadJobs();
    }
  };

  const restoreDeletedJob = async (job) => {
    try {
      const res = await JobsAPI.add({
        title: job.title,
        company: job.companyData || job.company,
        location: job.location,
        salary: job.salary,
        url: job.url,
        deadline: job.deadline,
        industry: job.industry,
        job_type: job.jobType || job.job_type,
        description: job.description,
        status: job.status,
        status_history: job.status_history,
        notes: job.notes,
        contacts: job.contacts,
        salary_notes: job.salaryNotes || job.salary_notes,
        interview_notes: job.interviewNotes || job.interview_notes
      });

      if (res && res.data.job_id) {
        const restoredJob = {
          ...job,
          id: res.data.job_id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setJobs(prev => [...prev, restoredJob]);
        setUndoStack(prev => prev.filter(item => item.job?.id !== job.id));
        alert(`✅ Job "${job.title}" restored successfully`);
      }
    } catch (error) {
      console.error("Failed to restore deleted job:", error);
      alert("Failed to restore job. Please try again.");
    }
  };

  const deleteJob = async (id, silent = false) => {
    if (!silent && !window.confirm("Are you sure you want to delete this job?")) return;
    
    try {
      const jobToDelete = jobs.find(j => j.id === id);
      
      await JobsAPI.delete(id);
      setJobs(jobs.filter((j) => j.id !== id));
      setSelectedJob(null);
      setSelectedJobIds(prev => prev.filter(jid => jid !== id));
      
      if (!silent) {
        setUndoStack(prev => [...prev, {
          type: 'delete',
          job: jobToDelete,
          timestamp: Date.now()
        }]);
        
        setTimeout(() => {
          if (!window.confirm(`✅ Job "${jobToDelete.title}" deleted.\n\nClick OK to continue\nClick Cancel to UNDO`)) {
            restoreDeletedJob(jobToDelete);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert(error.response?.data?.detail || "Failed to delete job. Please try again.");
    }
  };

  const archiveJob = async (id, reason = "", silent = false) => {
    try {
      const jobToArchive = jobs.find(j => j.id === id);
      const archiveDate = new Date().toISOString();
      
      await JobsAPI.update(id, {
        archived: true,
        archive_reason: reason,
        archive_date: archiveDate
      });
      
      setJobs(jobs.map(j => j.id === id ? {
        ...j,
        archived: true,
        archiveReason: reason,
        archiveDate: archiveDate
      } : j));
      
      setSelectedJob(null);
      setSelectedJobIds(prev => prev.filter(jid => jid !== id));
      
      if (!silent) {
        setUndoStack(prev => [...prev, {
          type: 'archive',
          job: jobToArchive,
          timestamp: Date.now()
        }]);
        
        setTimeout(() => {
          if (!window.confirm(`✅ Job "${jobToArchive.title}" archived.\n\nClick OK to continue\nClick Cancel to UNDO`)) {
            restoreJob(id);
          }
        }, 100);
      }
    } catch (error) {
      console.error("Failed to archive job:", error);
      alert(error.response?.data?.detail || "Failed to archive job. Please try again.");
    }
  };

  const restoreJob = async (id) => {
    try {
      await JobsAPI.update(id, {
        archived: false,
        archive_reason: null,
        archive_date: null
      });
      
      setJobs(jobs.map(j => j.id === id ? {
        ...j,
        archived: false,
        archiveReason: null,
        archiveDate: null
      } : j));
      
      setUndoStack(prev => prev.filter(item => item.job?.id !== id));
    } catch (error) {
      console.error("Failed to restore job:", error);
      alert(error.response?.data?.detail || "Failed to restore job. Please try again.");
    }
  };

  return {
    addJob,
    updateJob,
    deleteJob,
    archiveJob,
    restoreJob,
    restoreDeletedJob,
    loadJobs,
    checkAutoArchive
  };
}