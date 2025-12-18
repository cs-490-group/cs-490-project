import { useState, useMemo, useCallback } from "react";

export function useJobFilters(jobs, stages, showArchived) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");
  const [salaryFilter, setSalaryFilter] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setIndustryFilter("All");
    setLocationFilter("");
    setJobTypeFilter("All");
    setSalaryFilter("");
  };

  const getLastUpdateTime = useCallback((job) => {
    const history = job.status_history || job.statusHistory;
    
    if (history && Array.isArray(history) && history.length > 0) {
      const lastEntry = history[history.length - 1];
      
      let timestamp;
      if (Array.isArray(lastEntry)) {
        timestamp = lastEntry[1];
      } else if (lastEntry && typeof lastEntry === 'object') {
        timestamp = lastEntry.timestamp;
      }
      
      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    if (job.createdAt) {
      const createdDate = new Date(job.createdAt);
      if (!isNaN(createdDate.getTime())) {
        return createdDate;
      }
    }
    
    return new Date(0);
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (showArchived && !job.archived) return false;
      if (!showArchived && job.archived) return false;

      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === "All" || job.status === statusFilter;
      const matchesIndustry = industryFilter === "All" || job.industry === industryFilter;
      const matchesLocation = !locationFilter || (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
      const matchesJobType = jobTypeFilter === "All" || job.jobType === jobTypeFilter;

      let matchesSalary = true;
      if (salaryFilter) {
        const minSalary = parseInt(salaryFilter, 10);
        if (!isNaN(minSalary) && job.salary) {
          const salaryNumbers = job.salary.match(/\d+/g);
          if (salaryNumbers && salaryNumbers.length > 0) {
            const jobMinSalary = parseInt(salaryNumbers[0], 10) * (job.salary.includes("k") ? 1000 : 1);
            matchesSalary = jobMinSalary >= minSalary;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesIndustry && matchesLocation && matchesJobType && matchesSalary;
    });
  }, [jobs, showArchived, searchTerm, statusFilter, industryFilter, locationFilter, jobTypeFilter, salaryFilter]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      switch (sortBy) {
        case "recentlyUpdated":
          return getLastUpdateTime(b) - getLastUpdateTime(a);
        
        case "leastRecentlyUpdated":
          return getLastUpdateTime(a) - getLastUpdateTime(b);
        
        case "deadline":
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        
        case "company":
          return a.company.localeCompare(b.company);
        
        case "title":
          return a.title.localeCompare(b.title);
        
        case "archiveDate":
          if (!a.archiveDate) return 1;
          if (!b.archiveDate) return -1;
          return new Date(b.archiveDate) - new Date(a.archiveDate);
        
        case "dateAdded":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [filteredJobs, sortBy, getLastUpdateTime]);

  const groupedJobs = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = sortedJobs.filter((job) => job.status === stage);
      return acc;
    }, {});
  }, [sortedJobs, stages]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    industryFilter,
    setIndustryFilter,
    locationFilter,
    setLocationFilter,
    jobTypeFilter,
    setJobTypeFilter,
    salaryFilter,
    setSalaryFilter,
    sortBy,
    setSortBy,
    clearAllFilters,
    sortedJobs,
    groupedJobs
  };
}