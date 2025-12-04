import JobsAPI from "../../../api/jobs";

export function useJobOperations(setJobs, setSelectedJob, setSelectedJobIds, setUndoStack, jobs, autoArchiveDays, autoArchiveEnabled, setView) {
  
  const loadJobs = async (setLoading, preserveView = false) => {
    try {
      if (setLoading) setLoading(true);

      const res = await JobsAPI.getAll();

      const transformedJobs = (res.data || []).map(job => {
        console.log("JOB FROM BACKEND:", job);

        const t = {
          id: job._id,
          title: job.title,
          company: typeof job.company === "string" ? job.company : job.company?.name,
          companyData: job.company_data || null,
          company_news: job.company_news || null,
          company_research: job.company_research || null,
          location: job.location,
          salary: job.salary,
          url: job.url,
          deadline: job.deadline,
          industry: job.industry,
          job_type: job.job_type,
          description: job.description,
          status: job.status,
          archived: job.archived,
          notes: job.notes,
          contacts: job.contacts,
          interview_notes: job.interview_notes,
          status_history: job.status_history || [],
          materials: job.materials || null,
          materials_history: job.materials_history || [],
        };

        console.log("TRANSFORMED JOB:", t);
        return t;
      });

      setJobs(transformedJobs);
      
      // Only switch to pipeline view if preserveView is true
      if (preserveView && setView) {
        setView("pipeline");
      }
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
    console.log("📡 addJob CALLED with:", jobData);
    try {
      const backendData = {
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        salary: jobData.salary,
        url: jobData.url,
        deadline: jobData.deadline,
        industry: jobData.industry,
        job_type: jobData.job_type,
        description: jobData.description,
        status: jobData.status,
        notes: jobData.notes,
        contacts: jobData.contacts,
        interview_notes: jobData.interview_notes,
        status_history: jobData.status_history,
        company_data: jobData.company_data || null
      };

      console.log("BACKEND DATA:", backendData);
      
      const res = await JobsAPI.add(backendData);

      if (res && res.data.job_id) {
        // Backend now returns the full job object
        const backendJob = res.data.job;

        const newJob = backendJob ? {
          id: backendJob._id,
          title: backendJob.title,
          company: typeof backendJob.company === "string" ? backendJob.company : backendJob.company?.name,
          companyData: backendJob.company_data || null,
          company_news: backendJob.company_news || null,
          company_research: backendJob.company_research || null,
          salary_negotiation: backendJob.salary_negotiation || null,
          location: backendJob.location,
          salary: backendJob.salary,
          url: backendJob.url,
          deadline: backendJob.deadline,
          industry: backendJob.industry,
          job_type: backendJob.job_type,
          description: backendJob.description,
          status: backendJob.status,
          archived: backendJob.archived || false,
          notes: backendJob.notes,
          contacts: backendJob.contacts,
          interview_notes: backendJob.interview_notes,
          status_history: backendJob.status_history || [],
          materials: backendJob.materials || null,
          materials_history: backendJob.materials_history || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } : {
          id: res.data.job_id,
          ...jobData,
          company: jobData.company,
          companyData: jobData.companyData,
          jobType: jobData.job_type,
          interviewNotes: jobData.interview_notes,
          statusHistory: (jobData.status_history || []).map(([status, timestamp]) => ({ status, timestamp })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setJobs(prev => [...prev, newJob]);
        
        // Show success message
        //alert("✅ Job added successfully! Research data is being generated in the background.");
        setView("pipeline");
        // Optional: Poll for research completion and switch to pipeline view
        if (backendJob && !backendJob.company_research) {
          console.log("📊 Research pending for job:", newJob.id);
          setTimeout(() => {
            loadJobs(null, true); // Refresh to get research data and switch to pipeline
          }, 5000); // Check after 5 seconds
        } else if (setView) {
          // If research is already complete, switch to pipeline immediately
          setView("pipeline");
        }
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
      
      console.log('🔄 Updating job:', id, 'with data:', backendData);
      
      const response = await JobsAPI.update(id, backendData);
      
      console.log('✅ Update response:', response);
      
      const enrichedMaterials = response?.data?.materials || jobData.materials;
      
      console.log('📦 Enriched materials:', enrichedMaterials);

      setJobs(prev => prev.map(job => {
        if (job.id === id) {
          return {
            ...job,
            ...jobData,
            materials: enrichedMaterials,
            updatedAt: new Date().toISOString()
          };
        }
        return job;
      }));

      setSelectedJob(null);
      
      console.log('✅ Job updated successfully with materials:', enrichedMaterials);
      
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

  const retryJobResearch = async (jobId) => {
    try {
      console.log(`🔄 Retrying research for job ${jobId}`);
      
      const res = await JobsAPI.retryResearch(jobId);
      
      if (res && res.data) {
        console.log(`✅ Research completed:`, res.data.updated_fields);
        
        await loadJobs();
        
        alert(`✅ Research completed successfully!\nUpdated: ${res.data.updated_fields.join(', ')}`);
      }
    } catch (error) {
      console.error("Failed to retry research:", error);
      alert(error.response?.data?.detail || "Failed to retry research. Please try again later.");
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
    checkAutoArchive,
    retryJobResearch
  };
}