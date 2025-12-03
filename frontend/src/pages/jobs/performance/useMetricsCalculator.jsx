import { useMemo } from "react";

export function useMetricsCalculator(filteredJobs) {
  return useMemo(() => {
    console.group("🔍 Metrics Calculator Debug");
    console.log("Total filtered jobs:", filteredJobs.length);
    console.log("Sample job:", filteredJobs[0]);
    
    // Status counts
    const interested = filteredJobs.filter(j => j.status === "Interested").length;
    const applied = filteredJobs.filter(j => j.status === "Applied").length;
    const screening = filteredJobs.filter(j => j.status === "Screening").length;
    const interview = filteredJobs.filter(j => j.status === "Interview").length;
    const offer = filteredJobs.filter(j => j.status === "Offer").length;
    const rejected = filteredJobs.filter(j => j.status === "Rejected").length;
    
    console.log("Status counts:", { interested, applied, screening, interview, offer, rejected });
    
    const totalApplications = applied + screening + interview + offer + rejected;
    const totalActive = filteredJobs.length;
    
    // Conversion rates through funnel
    const responseRate = totalApplications > 0 
      ? ((screening + interview + offer + rejected) / totalApplications * 100).toFixed(1)
      : 0;
    
    const screeningRate = totalApplications > 0
      ? ((screening + interview + offer) / totalApplications * 100).toFixed(1)
      : 0;
    
    const interviewRate = totalApplications > 0
      ? ((interview + offer) / totalApplications * 100).toFixed(1)
      : 0;
    
    const offerRate = totalApplications > 0
      ? (offer / totalApplications * 100).toFixed(1)
      : 0;
    
    const rejectionRate = totalApplications > 0
      ? (rejected / totalApplications * 100).toFixed(1)
      : 0;
    
    // Time-to-response calculations
    const responseTimes = [];
    const interviewScheduleTimes = [];
    
    filteredJobs.forEach(job => {
      // Handle both snake_case and camelCase
      let statusHistory = job.statusHistory || job.status_history;
      
      // Convert array of arrays to objects if needed
      if (statusHistory && statusHistory.length > 0 && Array.isArray(statusHistory[0])) {
        statusHistory = statusHistory.map(([status, timestamp]) => ({ status, timestamp }));
      }
      
      if (statusHistory && statusHistory.length > 1) {
        // Find when job was applied
        const appliedEntry = statusHistory.find(h => h.status === "Applied");
        
        if (appliedEntry) {
          const appliedDate = new Date(appliedEntry.timestamp);
          
          // Time to first response (any status change after Applied)
          const firstResponseEntry = statusHistory.find(h => 
            h.status !== "Interested" && h.status !== "Applied" && 
            new Date(h.timestamp) > appliedDate
          );
          
          if (firstResponseEntry) {
            const responseDate = new Date(firstResponseEntry.timestamp);
            const days = Math.floor((responseDate - appliedDate) / (1000 * 60 * 60 * 24));
            if (days >= 0) responseTimes.push(days);
          }
          
          // Time to interview
          const interviewEntry = statusHistory.find(h => h.status === "Interview");
          if (interviewEntry) {
            const interviewDate = new Date(interviewEntry.timestamp);
            const days = Math.floor((interviewDate - appliedDate) / (1000 * 60 * 60 * 24));
            if (days >= 0) interviewScheduleTimes.push(days);
          }
        }
      }
    });
    
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    const avgInterviewScheduleTime = interviewScheduleTimes.length > 0
      ? Math.round(interviewScheduleTimes.reduce((a, b) => a + b, 0) / interviewScheduleTimes.length)
      : 0;
    
    console.log("Time metrics:", {
      responseTimes: responseTimes.length,
      avgResponseTime,
      interviewScheduleTimes: interviewScheduleTimes.length,
      avgInterviewScheduleTime
    });
    
    // Application volume trends
    const weeklyVolume = {};
    
    filteredJobs.forEach(job => {
      const createdAt = job.createdAt || job.date_created;
      if (createdAt) {
        const jobDate = new Date(createdAt);
        const weekStart = new Date(jobDate);
        weekStart.setDate(jobDate.getDate() - jobDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + 1;
      }
    });
    
    const recentWeeks = Object.keys(weeklyVolume)
      .sort()
      .slice(-8)
      .map(week => ({
        week,
        count: weeklyVolume[week]
      }));
    
    const avgWeeklyApplications = recentWeeks.length > 0
      ? Math.round(recentWeeks.reduce((sum, w) => sum + w.count, 0) / recentWeeks.length)
      : 0;
    
    // Success patterns
    const successfulJobs = filteredJobs.filter(j => j.status === "Offer" || j.status === "Interview");
    const industrySuccess = {};
    const locationSuccess = {};
    
    successfulJobs.forEach(job => {
      if (job.industry) {
        industrySuccess[job.industry] = (industrySuccess[job.industry] || 0) + 1;
      }
      if (job.location) {
        locationSuccess[job.location] = (locationSuccess[job.location] || 0) + 1;
      }
    });
    
    const topIndustries = Object.entries(industrySuccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const topLocations = Object.entries(locationSuccess)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    // FIXED: Goal progress calculations
    const currentDate = new Date();
    
    // Applications this week - count jobs that moved to "Applied" status this week
    const applicationsThisWeek = filteredJobs.filter(job => {
      let statusHistory = job.statusHistory || job.status_history;
      if (!statusHistory) return false;
      
      // Convert array of arrays to objects if needed
      if (Array.isArray(statusHistory[0])) {
        statusHistory = statusHistory.map(([status, timestamp]) => ({ status, timestamp }));
      }
      
      // Find when the job was applied to
      const appliedEntry = statusHistory.find(h => h.status === "Applied");
      if (!appliedEntry) return false;
      
      const appliedDate = new Date(appliedEntry.timestamp);
      const daysSinceApplied = Math.floor((currentDate - appliedDate) / (1000 * 60 * 60 * 24));
      
      return daysSinceApplied <= 7;
    }).length;
    
    console.log("Applications this week:", applicationsThisWeek);
    
    // Interviews this month - count jobs that moved to "Interview" status this month
    const interviewsThisMonth = filteredJobs.filter(job => {
      if (job.status !== "Interview" && job.status !== "Offer") return false;
      
      let statusHistory = job.statusHistory || job.status_history;
      if (!statusHistory) return false;
      
      // Convert array of arrays to objects if needed
      if (Array.isArray(statusHistory[0])) {
        statusHistory = statusHistory.map(([status, timestamp]) => ({ status, timestamp }));
      }
      
      // Find when the job moved to Interview status
      const interviewEntry = statusHistory.find(h => h.status === "Interview");
      if (!interviewEntry) return false;
      
      const interviewDate = new Date(interviewEntry.timestamp);
      
      return interviewDate.getMonth() === currentDate.getMonth() &&
             interviewDate.getFullYear() === currentDate.getFullYear();
    }).length;
    
    console.log("Interviews this month:", interviewsThisMonth);
    
    // UC-097: Application Success Rate Analysis
    // Analyze by company size
    const companySizeSuccess = {};
    filteredJobs.forEach(job => {
      const companySize = job.company_data?.size || job.companyData?.size || job.companySize;
      if (companySize) {
        if (!companySizeSuccess[companySize]) {
          companySizeSuccess[companySize] = { total: 0, successful: 0 };
        }
        companySizeSuccess[companySize].total++;
        if (job.status === 'Interview' || job.status === 'Offer') {
          companySizeSuccess[companySize].successful++;
        }
      }
    });
    
    const companySizeSuccessRates = Object.entries(companySizeSuccess)
      .map(([size, data]) => ({
        size,
        successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0,
        total: data.total,
        successful: data.successful
      }))
      .filter(c => c.total >= 2)
      .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
    
    // Analyze by application source/method
    const sourceSuccess = {};
    filteredJobs.forEach(job => {
      const source = job.source || 'Direct';
      if (!sourceSuccess[source]) {
        sourceSuccess[source] = { total: 0, successful: 0 };
      }
      sourceSuccess[source].total++;
      if (job.status === 'Interview' || job.status === 'Offer') {
        sourceSuccess[source].successful++;
      }
    });
    
    const sourceSuccessRates = Object.entries(sourceSuccess).map(([source, data]) => ({
      source,
      successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0,
      total: data.total,
      successful: data.successful
    })).sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
    
    // Analyze customization impact
    const customizationImpact = {
      customized: { total: 0, successful: 0 },
      notCustomized: { total: 0, successful: 0 }
    };
    
    filteredJobs.forEach(job => {
      const isCustomized = job.coverLetter || job.customNotes;
      const category = isCustomized ? 'customized' : 'notCustomized';
      customizationImpact[category].total++;
      if (job.status === 'Interview' || job.status === 'Offer') {
        customizationImpact[category].successful++;
      }
    });
    
    const customizationSuccessRate = customizationImpact.customized.total > 0
      ? ((customizationImpact.customized.successful / customizationImpact.customized.total) * 100).toFixed(1)
      : 0;
    const nonCustomizationSuccessRate = customizationImpact.notCustomized.total > 0
      ? ((customizationImpact.notCustomized.successful / customizationImpact.notCustomized.total) * 100).toFixed(1)
      : 0;
    
    // Timing pattern analysis - day of week
    const dayOfWeekSuccess = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    days.forEach(day => dayOfWeekSuccess[day] = { total: 0, successful: 0 });
    
    filteredJobs.forEach(job => {
      let statusHistory = job.statusHistory || job.status_history;
      if (statusHistory) {
        // Convert array of arrays to objects if needed
        if (Array.isArray(statusHistory[0])) {
          statusHistory = statusHistory.map(([status, timestamp]) => ({ status, timestamp }));
        }
        
        // Find when applied
        const appliedEntry = statusHistory.find(h => h.status === "Applied");
        if (appliedEntry) {
          const dayName = days[new Date(appliedEntry.timestamp).getDay()];
          dayOfWeekSuccess[dayName].total++;
          if (job.status === 'Interview' || job.status === 'Offer') {
            dayOfWeekSuccess[dayName].successful++;
          }
        }
      }
    });
    
    const bestApplicationDays = Object.entries(dayOfWeekSuccess)
      .map(([day, data]) => ({
        day,
        successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0,
        total: data.total
      }))
      .filter(d => d.total >= 3)
      .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
    
    // Success patterns by role type
    const roleTypeSuccess = {};
    filteredJobs.forEach(job => {
      const role = job.role || job.title || 'Unknown';
      const roleCategory = categorizeRole(role);
      if (!roleTypeSuccess[roleCategory]) {
        roleTypeSuccess[roleCategory] = { total: 0, successful: 0 };
      }
      roleTypeSuccess[roleCategory].total++;
      if (job.status === 'Interview' || job.status === 'Offer') {
        roleTypeSuccess[roleCategory].successful++;
      }
    });
    
    const roleTypeSuccessRates = Object.entries(roleTypeSuccess)
      .map(([role, data]) => ({
        role,
        successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0,
        total: data.total,
        successful: data.successful
      }))
      .filter(r => r.total >= 2)
      .sort((a, b) => parseFloat(b.successRate) - parseFloat(a.successRate));
    
    // Helper function to categorize roles
    function categorizeRole(title) {
      const lower = title.toLowerCase();
      if (lower.includes('senior') || lower.includes('sr')) return 'Senior';
      if (lower.includes('junior') || lower.includes('jr') || lower.includes('entry')) return 'Junior';
      if (lower.includes('lead') || lower.includes('principal')) return 'Lead/Principal';
      if (lower.includes('manager') || lower.includes('director')) return 'Management';
      return 'Mid-Level';
    }
    
    // Calculate recommendations
    const getRecommendations = () => {
      const recs = [];
      
      if (sourceSuccessRates.length > 1 && sourceSuccessRates[0].total >= 5) {
        const best = sourceSuccessRates[0];
        if (parseFloat(best.successRate) > parseFloat(responseRate) * 1.5) {
          recs.push({
            type: 'source',
            message: `Applications via ${best.source} have ${best.successRate}% success rate - prioritize this channel`,
            confidence: best.total >= 10 ? 'high' : 'medium'
          });
        }
      }
      
      const customizationDiff = parseFloat(customizationSuccessRate) - parseFloat(nonCustomizationSuccessRate);
      if (customizationImpact.customized.total >= 5 && customizationDiff > 10) {
        recs.push({
          type: 'customization',
          message: `Customized applications are ${customizationDiff.toFixed(1)}% more successful - invest time in tailoring`,
          confidence: 'high'
        });
      }
      
      if (bestApplicationDays.length > 0 && bestApplicationDays[0].total >= 5) {
        const bestDay = bestApplicationDays[0];
        if (parseFloat(bestDay.successRate) > parseFloat(responseRate) * 1.3) {
          recs.push({
            type: 'timing',
            message: `${bestDay.day} applications have ${bestDay.successRate}% success rate - best day to apply`,
            confidence: bestDay.total >= 10 ? 'high' : 'medium'
          });
        }
      }
      
      if (roleTypeSuccessRates.length > 0 && roleTypeSuccessRates[0].total >= 3) {
        const bestRole = roleTypeSuccessRates[0];
        if (parseFloat(bestRole.successRate) > parseFloat(responseRate) * 1.5) {
          recs.push({
            type: 'role',
            message: `${bestRole.role} roles have ${bestRole.successRate}% success rate - strong match for your profile`,
            confidence: bestRole.total >= 5 ? 'high' : 'medium'
          });
        }
      }
      
      if (companySizeSuccessRates.length > 0 && companySizeSuccessRates[0].total >= 3) {
        const bestSize = companySizeSuccessRates[0];
        if (parseFloat(bestSize.successRate) > parseFloat(responseRate) * 1.3) {
          recs.push({
            type: 'companySize',
            message: `${bestSize.size} companies have ${bestSize.successRate}% success rate - focus on this company size`,
            confidence: bestSize.total >= 5 ? 'high' : 'medium'
          });
        }
      }
      
      if (topIndustries.length > 0 && topIndustries[0][1] >= 3) {
        recs.push({
          type: 'industry',
          message: `${topIndustries[0][0]} is your strongest industry with ${topIndustries[0][1]} successes`,
          confidence: 'high'
        });
      }
      
      return recs;
    };
    
    // Industry benchmarks
    const benchmarks = {
      responseRate: 25,
      interviewRate: 15,
      offerRate: 5,
      avgResponseTime: 14,
      avgInterviewTime: 21
    };
    
    console.groupEnd();
    
    return {
      interested,
      applied,
      screening,
      interview,
      offer,
      rejected,
      totalApplications,
      totalActive,
      responseRate: parseFloat(responseRate),
      screeningRate: parseFloat(screeningRate),
      interviewRate: parseFloat(interviewRate),
      offerRate: parseFloat(offerRate),
      rejectionRate: parseFloat(rejectionRate),
      avgResponseTime,
      avgInterviewScheduleTime,
      responseTimes,
      interviewScheduleTimes,
      recentWeeks,
      avgWeeklyApplications,
      topIndustries,
      topLocations,
      applicationsThisWeek,
      interviewsThisMonth,
      benchmarks,
      companySizeSuccess,
      companySizeSuccessRates,
      sourceSuccessRates,
      customizationSuccessRate,
      nonCustomizationSuccessRate,
      customizationImpact,
      bestApplicationDays,
      roleTypeSuccessRates,
      recommendations: getRecommendations()
    };
  }, [filteredJobs]);
}