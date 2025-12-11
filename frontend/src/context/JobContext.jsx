import React, { createContext, useContext, useState } from 'react';

const JobContext = createContext();

export function JobProvider({ children }) {
  const [selectedJob, setSelectedJob] = useState(null);

  const selectJob = (job) => {
    setSelectedJob(job);
  };

  const clearJob = () => {
    setSelectedJob(null);
  };

  const value = {
    selectedJob,
    selectJob,
    clearJob,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJob() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
}
