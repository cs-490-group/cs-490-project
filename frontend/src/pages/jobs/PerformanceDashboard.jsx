import React, { useState, useMemo } from "react";

export default function PerformanceDashboard({ jobs }) {
  const [dateRange, setDateRange] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('jobSearchGoals');
      return saved ? JSON.parse(saved) : {
        weeklyApplications: 10,
        monthlyInterviews: 5,
        targetResponseRate: 30,
        targetInterviewRate: 20
      };
    } catch {
      return {
        weeklyApplications: 10,
        monthlyInterviews: 5,
        targetResponseRate: 30,
        targetInterviewRate: 20
      };
    }
  });
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [showSuccessAnalysis, setShowSuccessAnalysis] = useState(false);

  // Filter jobs by date range
  const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(j => !j.archived);
    
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch(dateRange) {
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case "6months":
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(j => new Date(j.createdAt) >= cutoffDate);
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(j => j.status === filterStatus);
    }
    
    return filtered;
  }, [jobs, dateRange, filterStatus]);

  // Calculate comprehensive metrics
  const metrics = useMemo(() => {
    // Status counts
    const interested = filteredJobs.filter(j => j.status === "Interested").length;
    const applied = filteredJobs.filter(j => j.status === "Applied").length;
    const screening = filteredJobs.filter(j => j.status === "Screening").length;
    const interview = filteredJobs.filter(j => j.status === "Interview").length;
    const offer = filteredJobs.filter(j => j.status === "Offer").length;
    const rejected = filteredJobs.filter(j => j.status === "Rejected").length;
    
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
      if (job.statusHistory && job.statusHistory.length > 1) {
        const appliedEntry = job.statusHistory.find(h => h.status === "Applied");
        
        if (appliedEntry) {
          const appliedDate = new Date(appliedEntry.timestamp);
          
          // Time to first response
          const firstResponseEntry = job.statusHistory.find(h => 
            h.status !== "Interested" && h.status !== "Applied" && 
            new Date(h.timestamp) > appliedDate
          );
          
          if (firstResponseEntry) {
            const responseDate = new Date(firstResponseEntry.timestamp);
            const days = Math.floor((responseDate - appliedDate) / (1000 * 60 * 60 * 24));
            responseTimes.push(days);
          }
          
          // Time to interview
          const interviewEntry = job.statusHistory.find(h => h.status === "Interview");
          if (interviewEntry) {
            const interviewDate = new Date(interviewEntry.timestamp);
            const days = Math.floor((interviewDate - appliedDate) / (1000 * 60 * 60 * 24));
            interviewScheduleTimes.push(days);
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
    
    // Application volume trends
    const weeklyVolume = {};
    const now = new Date();
    
    filteredJobs.forEach(job => {
      if (job.createdAt) {
        const jobDate = new Date(job.createdAt);
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
    
    // UC-097: Application Success Rate Analysis
    // Analyze by company size
    const companySizeSuccess = {};
    filteredJobs.forEach(job => {
      const companySize = job.company_data?.size || job.companySize;
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
    
    // Calculate success rates by source
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
      if (job.createdAt) {
        const dayName = days[new Date(job.createdAt).getDay()];
        dayOfWeekSuccess[dayName].total++;
        if (job.status === 'Interview' || job.status === 'Offer') {
          dayOfWeekSuccess[dayName].successful++;
        }
      }
    });
    
    const bestApplicationDays = Object.entries(dayOfWeekSuccess)
      .map(([day, data]) => ({
        day,
        successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : 0,
        total: data.total
      }))
      .filter(d => d.total >= 3) // Only include days with statistically significant data
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
      .filter(r => r.total >= 2) // Statistical significance
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
    
    // Calculate statistical significance for recommendations
    const getRecommendations = () => {
      const recs = [];
      
      // Source recommendations
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
      
      // Customization recommendations
      const customizationDiff = parseFloat(customizationSuccessRate) - parseFloat(nonCustomizationSuccessRate);
      if (customizationImpact.customized.total >= 5 && customizationDiff > 10) {
        recs.push({
          type: 'customization',
          message: `Customized applications are ${customizationDiff.toFixed(1)}% more successful - invest time in tailoring`,
          confidence: 'high'
        });
      }
      
      // Timing recommendations
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
      
      // Role type recommendations
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
      
      // Company size recommendations
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
      
      // Industry recommendations
      if (topIndustries.length > 0 && topIndustries[0][1] >= 3) {
        recs.push({
          type: 'industry',
          message: `${topIndustries[0][0]} is your strongest industry with ${topIndustries[0][1]} successes`,
          confidence: 'high'
        });
      }
      
      return recs;
    };
    
    // Goal progress
    const currentDate = new Date();
    const weekNumber = Math.ceil((currentDate.getDate()) / 7);
    const applicationsThisWeek = filteredJobs.filter(j => {
      const jobDate = new Date(j.createdAt);
      const daysDiff = Math.floor((currentDate - jobDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length;
    
    const interviewsThisMonth = filteredJobs.filter(j => {
      const jobDate = new Date(j.createdAt);
      return j.status === "Interview" && 
             jobDate.getMonth() === currentDate.getMonth() &&
             jobDate.getFullYear() === currentDate.getFullYear();
    }).length;
    
    // Industry benchmarks (example values)
    const benchmarks = {
      responseRate: 25,
      interviewRate: 15,
      offerRate: 5,
      avgResponseTime: 14,
      avgInterviewTime: 21
    };
    
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

  const saveGoals = () => {
    try {
      localStorage.setItem('jobSearchGoals', JSON.stringify(goals));
      setShowGoalSettings(false);
      alert('✅ Goals saved successfully!');
    } catch (error) {
      alert('Failed to save goals. Please try again.');
    }
  };

  const MetricCard = ({ title, value, subtitle, trend, color = "#4f8ef7", icon, benchmark }) => (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${color}`,
      position: "relative"
    }}>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: "36px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
          {subtitle}
        </div>
      )}
      {trend && (
        <div style={{ 
          fontSize: "12px", 
          color: trend > 0 ? "#4caf50" : trend < 0 ? "#f44336" : "#666",
          fontWeight: "600"
        }}>
          {trend > 0 ? "↗" : trend < 0 ? "↘" : "→"} {Math.abs(trend)}% vs last period
        </div>
      )}
      {benchmark !== undefined && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "11px",
          padding: "4px 8px",
          borderRadius: "4px",
          background: parseFloat(value) >= benchmark ? "#e8f5e9" : "#fff3e0",
          color: parseFloat(value) >= benchmark ? "#2e7d32" : "#e65100"
        }}>
          Benchmark: {benchmark}%
        </div>
      )}
    </div>
  );

  const FunnelChart = () => {
    const stages = [
      { label: "Interested", count: metrics.interested, color: "#9e9e9e" },
      { label: "Applied", count: metrics.applied, color: "#2196f3" },
      { label: "Screening", count: metrics.screening, color: "#ff9800" },
      { label: "Interview", count: metrics.interview, color: "#ff5722" },
      { label: "Offer", count: metrics.offer, color: "#4caf50" }
    ];
    
    const maxCount = Math.max(...stages.map(s => s.count));
    
    return (
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🎯 Job Search Funnel</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          {stages.map((stage, idx) => {
            const width = maxCount > 0 ? (stage.count / maxCount * 100) : 0;
            const conversionFromPrev = idx > 0 && stages[idx - 1].count > 0
              ? ((stage.count / stages[idx - 1].count) * 100).toFixed(1)
              : 100;
            
            return (
              <div key={stage.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    {stage.label}
                  </span>
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    {stage.count} {idx > 0 && `(${conversionFromPrev}%)`}
                  </span>
                </div>
                <div style={{
                  width: "100%",
                  height: "32px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${width}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${stage.color}, ${stage.color}dd)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "14px",
                    minWidth: stage.count > 0 ? "40px" : "0"
                  }}>
                    {stage.count > 0 && stage.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "100%", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <h2 style={{ margin: 0, color: "#333" }}>📈 Performance Dashboard</h2>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            <option value="all">All Time</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Interested">Interested</option>
            <option value="Applied">Applied</option>
            <option value="Screening">Screening</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
          
          <button
            onClick={() => setShowGoalSettings(!showGoalSettings)}
            style={{
              padding: "8px 16px",
              background: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            🎯 Set Goals
          </button>
          
          <button
            onClick={() => setShowSuccessAnalysis(!showSuccessAnalysis)}
            style={{
              padding: "8px 16px",
              background: showSuccessAnalysis ? "#00695c" : "#00897b",
              color: "white",
              border: showSuccessAnalysis ? "2px solid #4caf50" : "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: showSuccessAnalysis ? "0 0 0 3px rgba(76, 175, 80, 0.3)" : "none",
              transition: "all 0.3s ease"
            }}
          >
            {showSuccessAnalysis ? "✓ " : ""}📊 Success Analysis
          </button>
        </div>
      </div>

      {/* Goal Settings Modal */}
      {showGoalSettings && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}
        onClick={() => setShowGoalSettings(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%"
            }}
          >
            <h3 style={{ marginTop: 0 }}>🎯 Set Your Goals</h3>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                Weekly Applications Goal
              </label>
              <input
                type="number"
                value={goals.weeklyApplications}
                onChange={(e) => setGoals({...goals, weeklyApplications: parseInt(e.target.value) || 0})}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                Monthly Interviews Goal
              </label>
              <input
                type="number"
                value={goals.monthlyInterviews}
                onChange={(e) => setGoals({...goals, monthlyInterviews: parseInt(e.target.value) || 0})}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                Target Response Rate (%)
              </label>
              <input
                type="number"
                value={goals.targetResponseRate}
                onChange={(e) => setGoals({...goals, targetResponseRate: parseInt(e.target.value) || 0})}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "600" }}>
                Target Interview Rate (%)
              </label>
              <input
                type="number"
                value={goals.targetInterviewRate}
                onChange={(e) => setGoals({...goals, targetInterviewRate: parseInt(e.target.value) || 0})}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowGoalSettings(false)}
                style={{
                  padding: "8px 16px",
                  background: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveGoals}
                style={{
                  padding: "8px 16px",
                  background: "#4f8ef7",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {!showSuccessAnalysis && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <MetricCard
              title="Applications Sent"
              value={metrics.totalApplications}
              subtitle={`${metrics.totalActive} total tracked`}
              color="#2196f3"
              icon="📤"
            />
            <MetricCard
              title="Response Rate"
              value={`${metrics.responseRate}%`}
              subtitle="Got a response"
              color="#ff9800"
              icon="📧"
              benchmark={metrics.benchmarks.responseRate}
            />
            <MetricCard
              title="Interview Rate"
              value={`${metrics.interviewRate}%`}
              subtitle="Reached interviews"
              color="#ff5722"
              icon="💼"
              benchmark={metrics.benchmarks.interviewRate}
            />
            <MetricCard
              title="Offers Received"
              value={metrics.offer}
              subtitle={`${metrics.offerRate}% offer rate`}
              color="#4caf50"
              icon="🎉"
              benchmark={metrics.benchmarks.offerRate}
            />
          </div>

          {/* Goal Progress */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#333" }}>📊 Weekly Applications Goal</h3>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2196f3", marginBottom: "8px" }}>
                {metrics.applicationsThisWeek} / {goals.weeklyApplications}
              </div>
              <div style={{ width: "100%", height: "12px", background: "#f5f5f5", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min((metrics.applicationsThisWeek / goals.weeklyApplications) * 100, 100)}%`,
                  height: "100%",
                  background: metrics.applicationsThisWeek >= goals.weeklyApplications ? "#4caf50" : "#2196f3",
                  transition: "width 0.3s ease"
                }} />
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
                {metrics.applicationsThisWeek >= goals.weeklyApplications ? "🎉 Goal achieved!" : `${goals.weeklyApplications - metrics.applicationsThisWeek} more needed`}
              </div>
            </div>

            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#333" }}>🎯 Monthly Interviews Goal</h3>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff5722", marginBottom: "8px" }}>
                {metrics.interviewsThisMonth} / {goals.monthlyInterviews}
              </div>
              <div style={{ width: "100%", height: "12px", background: "#f5f5f5", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min((metrics.interviewsThisMonth / goals.monthlyInterviews) * 100, 100)}%`,
                  height: "100%",
                  background: metrics.interviewsThisMonth >= goals.monthlyInterviews ? "#4caf50" : "#ff5722",
                  transition: "width 0.3s ease"
                }} />
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
                {metrics.interviewsThisMonth >= goals.monthlyInterviews ? "🎉 Goal achieved!" : `${goals.monthlyInterviews - metrics.interviewsThisMonth} more needed`}
              </div>
            </div>
          </div>

          {/* Funnel and Time Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <FunnelChart />
            
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>⏱️ Time Metrics</h3>
              
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Avg. Time to Response
                </div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff9800" }}>
                  {metrics.avgResponseTime}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  days (Benchmark: {metrics.benchmarks.avgResponseTime})
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                  Avg. Time to Interview
                </div>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ff5722" }}>
                  {metrics.avgInterviewScheduleTime}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  days (Benchmark: {metrics.benchmarks.avgInterviewTime})
                </div>
              </div>
            </div>
          </div>

          {/* Application Volume Trends */}
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📊 Weekly Application Volume</h3>
            {metrics.recentWeeks.length > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "180px", marginTop: "16px" }}>
                  {metrics.recentWeeks.map(data => {
                    const maxCount = Math.max(...metrics.recentWeeks.map(d => d.count));
                    const height = (data.count / maxCount) * 140;
                    const isAboveGoal = data.count >= goals.weeklyApplications;
                    
                    return (
                      <div key={data.week} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                          {data.count}
                        </div>
                        <div style={{
                          width: "100%",
                          height: `${height}px`,
                          background: isAboveGoal 
                            ? "linear-gradient(to top, #4caf50, #66bb6a)"
                            : "linear-gradient(to top, #4f8ef7, #2196f3)",
                          borderRadius: "4px 4px 0 0",
                          minHeight: "20px",
                          position: "relative"
                        }}>
                          {isAboveGoal && (
                            <div style={{
                              position: "absolute",
                              top: "-20px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "16px"
                            }}>
                              ⭐
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "#666", marginTop: "8px" }}>
                          {new Date(data.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: "16px", padding: "12px", background: "#f5f5f5", borderRadius: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                    Average: {metrics.avgWeeklyApplications} applications/week
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Goal: {goals.weeklyApplications} applications/week {metrics.avgWeeklyApplications >= goals.weeklyApplications ? "✅" : ""}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                No application data yet
              </div>
            )}
          </div>

          {/* Success Patterns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>🏆 Top Performing Industries</h3>
              {metrics.topIndustries.length > 0 ? (
                metrics.topIndustries.map(([industry, count], idx) => (
                  <div key={industry} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600" }}>{idx + 1}. {industry}</span>
                      <span style={{ fontSize: "14px", color: "#4caf50" }}>{count} successes</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${(count / metrics.topIndustries[0][1]) * 100}%`,
                        height: "100%",
                        background: "#4caf50"
                      }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                  No success patterns yet
                </div>
              )}
            </div>

            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📍 Top Performing Locations</h3>
              {metrics.topLocations.length > 0 ? (
                metrics.topLocations.map(([location, count], idx) => (
                  <div key={location} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600" }}>{idx + 1}. {location}</span>
                      <span style={{ fontSize: "14px", color: "#2196f3" }}>{count} successes</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${(count / metrics.topLocations[0][1]) * 100}%`,
                        height: "100%",
                        background: "#2196f3"
                      }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                  No success patterns yet
                </div>
              )}
            </div>
          </div>

          {/* Actionable Insights */}
          <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "24px", borderRadius: "8px", color: "white", marginBottom: "24px" }}>
            <h3 style={{ marginTop: 0, fontSize: "20px", marginBottom: "16px" }}>💡 Actionable Insights</h3>
            
            {/* Data-driven recommendations */}
            {metrics.recommendations.length > 0 && (
              <div style={{ marginBottom: "20px", padding: "16px", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
                <h4 style={{ fontSize: "16px", marginTop: 0, marginBottom: "12px" }}>🎯 Data-Driven Recommendations</h4>
                {metrics.recommendations.map((rec, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: "10px", 
                    paddingLeft: "20px", 
                    borderLeft: `3px solid ${rec.confidence === 'high' ? '#4caf50' : '#ff9800'}`,
                    fontSize: "14px",
                    lineHeight: "1.6"
                  }}>
                    <strong>{rec.confidence === 'high' ? '⭐ High Confidence:' : '💡 Medium Confidence:'}</strong> {rec.message}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <h4 style={{ fontSize: "16px", marginTop: 0, marginBottom: "12px" }}>🎯 What's Working</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.8" }}>
                  {metrics.responseRate >= goals.targetResponseRate && (
                    <li>Your response rate ({metrics.responseRate}%) exceeds your goal! Keep up the quality applications.</li>
                  )}
                  {metrics.interviewRate >= goals.targetInterviewRate && (
                    <li>Excellent interview conversion rate ({metrics.interviewRate}%)! Your applications are resonating.</li>
                  )}
                  {metrics.avgWeeklyApplications >= goals.weeklyApplications && (
                    <li>You're consistently meeting your weekly application goals. Great momentum!</li>
                  )}
                  {metrics.topIndustries.length > 0 && (
                    <li>Focus on {metrics.topIndustries[0][0]} - it's your strongest performing industry.</li>
                  )}
                  {metrics.avgResponseTime < metrics.benchmarks.avgResponseTime && (
                    <li>Companies are responding faster than average! Your applications stand out.</li>
                  )}
                  {metrics.offer > 0 && (
                    <li>You have {metrics.offer} offer(s)! You're on the right track.</li>
                  )}
                  {parseFloat(metrics.customizationSuccessRate) > parseFloat(metrics.nonCustomizationSuccessRate) * 1.2 && (
                    <li>Customized applications performing {((parseFloat(metrics.customizationSuccessRate) / parseFloat(metrics.nonCustomizationSuccessRate) - 1) * 100).toFixed(0)}% better!</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 style={{ fontSize: "16px", marginTop: 0, marginBottom: "12px" }}>📈 Areas to Improve</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", lineHeight: "1.8" }}>
                  {metrics.responseRate < goals.targetResponseRate && (
                    <li>Response rate is below target. Try tailoring applications more specifically to each role.</li>
                  )}
                  {metrics.interviewRate < goals.targetInterviewRate && (
                    <li>Interview rate could be improved. Consider getting feedback on your applications.</li>
                  )}
                  {metrics.avgWeeklyApplications < goals.weeklyApplications && (
                    <li>Increase application volume to {goals.weeklyApplications}/week to meet your goal.</li>
                  )}
                  {metrics.totalApplications > 0 && metrics.screening === 0 && (
                    <li>No applications have reached screening yet. Follow up on pending applications.</li>
                  )}
                  {metrics.rejectionRate > 50 && (
                    <li>High rejection rate ({metrics.rejectionRate}%). Focus on better job-skill alignment.</li>
                  )}
                  {metrics.avgResponseTime > metrics.benchmarks.avgResponseTime && (
                    <li>Response times are slower than average. Consider following up after 2 weeks.</li>
                  )}
                  {metrics.interested > metrics.applied * 2 && (
                    <li>You have many jobs marked "Interested". Convert more into applications!</li>
                  )}
                  {parseFloat(metrics.nonCustomizationSuccessRate) > parseFloat(metrics.customizationSuccessRate) && metrics.customizationImpact.customized.total >= 3 && (
                    <li>Non-customized applications performing better - may indicate over-customization or quality issues.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Performance vs Benchmarks */}
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333" }}>📊 Performance vs Industry Benchmarks</h3>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
              Compare your metrics against industry averages to identify opportunities
            </div>
            
            <div style={{ display: "grid", gap: "16px" }}>
              {[
                { label: "Response Rate", yours: metrics.responseRate, benchmark: metrics.benchmarks.responseRate, unit: "%" },
                { label: "Interview Rate", yours: metrics.interviewRate, benchmark: metrics.benchmarks.interviewRate, unit: "%" },
                { label: "Offer Rate", yours: metrics.offerRate, benchmark: metrics.benchmarks.offerRate, unit: "%" }
              ].map(metric => {
                const difference = metric.yours - metric.benchmark;
                const percentDiff = metric.benchmark > 0 ? ((difference / metric.benchmark) * 100).toFixed(0) : 0;
                const isAbove = difference >= 0;
                
                return (
                  <div key={metric.label} style={{ padding: "16px", background: "#f9f9f9", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}>{metric.label}</span>
                      <span style={{ 
                        fontSize: "14px", 
                        fontWeight: "600",
                        color: isAbove ? "#4caf50" : "#f44336"
                      }}>
                        {isAbove ? "+" : ""}{difference.toFixed(1)}{metric.unit} ({isAbove ? "+" : ""}{percentDiff}%)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Your Performance</div>
                        <div style={{ width: "100%", height: "24px", background: "#e3f2fd", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min((metric.yours / Math.max(metric.yours, metric.benchmark)) * 100, 100)}%`,
                            height: "100%",
                            background: isAbove ? "#4caf50" : "#2196f3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {metric.yours}{metric.unit}
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Industry Benchmark</div>
                        <div style={{ width: "100%", height: "24px", background: "#fff3e0", borderRadius: "4px", position: "relative", overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min((metric.benchmark / Math.max(metric.yours, metric.benchmark)) * 100, 100)}%`,
                            height: "100%",
                            background: "#ff9800",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            {metric.benchmark}{metric.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: "16px", padding: "12px", background: "#e8f5e9", borderRadius: "6px", fontSize: "13px", color: "#2e7d32" }}>
              💡 <strong>Tip:</strong> Benchmarks are based on industry averages. Focus on improving metrics where you're below benchmark to increase your success rate.
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ 
            background: "linear-gradient(135deg, #00c28a 0%, #005e9e 100%)", 
            padding: "24px", 
            borderRadius: "8px", 
            marginBottom: "24px",
            color: "white"
          }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", marginBottom: "16px" }}>📋 Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "4px" }}>Total Active Jobs</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.totalActive}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "4px" }}>Success Rate</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                  {((metrics.interview + metrics.offer) / Math.max(metrics.totalApplications, 1) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "4px" }}>Active Interviews</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.interview}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "4px" }}>Rejection Rate</div>
                <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.rejectionRate}%</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* UC-097: Application Success Rate Analysis */}
      {showSuccessAnalysis && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ 
            background: "linear-gradient(135deg, #00897b 0%, #00695c 100%)", 
            padding: "20px", 
            borderRadius: "8px 8px 0 0",
            color: "white"
          }}>
            <h2 style={{ margin: 0, fontSize: "24px" }}>📊 Application Success Rate Analysis</h2>
            <p style={{ margin: "8px 0 0 0", fontSize: "14px", opacity: 0.9 }}>
              Comprehensive analysis of what factors contribute to your application success
            </p>
          </div>

          {/* Success by Application Source/Method */}
          <div style={{ background: "white", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
              🎯 Success Rate by Application Source
            </h3>
            {metrics.sourceSuccessRates.length > 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {metrics.sourceSuccessRates.map((source, idx) => (
                  <div key={source.source} style={{ 
                    padding: "16px", 
                    background: "#f9f9f9", 
                    borderRadius: "8px",
                    borderLeft: `4px solid ${idx === 0 ? '#4caf50' : '#2196f3'}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                          {idx === 0 ? '🏆 ' : ''}{source.source}
                        </span>
                        <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                          ({source.successful}/{source.total} applications)
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: "20px", 
                        fontWeight: "bold", 
                        color: idx === 0 ? '#4caf50' : '#2196f3' 
                      }}>
                        {source.successRate}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${source.successRate}%`,
                        height: "100%",
                        background: idx === 0 ? '#4caf50' : '#2196f3',
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                Add source information to jobs to see success rate analysis
              </div>
            )}
          </div>

          {/* Customization Impact */}
          <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
              ✍️ Impact of Application Customization
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "20px", background: "#e8f5e9", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#2e7d32", marginBottom: "8px" }}>
                  Customized Applications
                </div>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4caf50" }}>
                  {metrics.customizationSuccessRate}%
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {metrics.customizationImpact.customized.successful}/{metrics.customizationImpact.customized.total} successful
                </div>
              </div>
              <div style={{ padding: "20px", background: "#fff3e0", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", color: "#e65100", marginBottom: "8px" }}>
                  Standard Applications
                </div>
                <div style={{ fontSize: "48px", fontWeight: "bold", color: "#ff9800" }}>
                  {metrics.nonCustomizationSuccessRate}%
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {metrics.customizationImpact.notCustomized.successful}/{metrics.customizationImpact.notCustomized.total} successful
                </div>
              </div>
            </div>
            {metrics.customizationImpact.customized.total >= 5 && (
              <div style={{ 
                marginTop: "16px", 
                padding: "12px", 
                background: parseFloat(metrics.customizationSuccessRate) > parseFloat(metrics.nonCustomizationSuccessRate) ? "#e8f5e9" : "#fff3e0",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#333"
              }}>
                <strong>Analysis:</strong> Customized applications are{' '}
                {parseFloat(metrics.customizationSuccessRate) > parseFloat(metrics.nonCustomizationSuccessRate) 
                  ? `${(parseFloat(metrics.customizationSuccessRate) - parseFloat(metrics.nonCustomizationSuccessRate)).toFixed(1)}% more successful. Continue investing time in personalization!`
                  : `performing ${(parseFloat(metrics.nonCustomizationSuccessRate) - parseFloat(metrics.customizationSuccessRate)).toFixed(1)}% worse. Consider quality over quantity.`
                }
              </div>
            )}
          </div>

          {/* Company Size Analysis */}
          <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
              🏢 Success Rate by Company Size
            </h3>
            {metrics.companySizeSuccessRates.length > 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {metrics.companySizeSuccessRates.map((company, idx) => (
                  <div key={company.size} style={{ 
                    padding: "16px", 
                    background: "#f9f9f9", 
                    borderRadius: "8px",
                    borderLeft: `4px solid ${idx === 0 ? '#ff5722' : '#ff7043'}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                          {idx === 0 ? '🏆 ' : ''}{company.size}
                        </span>
                        <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                          ({company.successful}/{company.total} applications)
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: "20px", 
                        fontWeight: "bold", 
                        color: idx === 0 ? '#ff5722' : '#ff7043' 
                      }}>
                        {company.successRate}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${company.successRate}%`,
                        height: "100%",
                        background: idx === 0 ? '#ff5722' : '#ff7043',
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                Add company size information to jobs to see this analysis
              </div>
            )}
          </div>

          {/* Optimal Application Timing */}
          <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
              ⏰ Optimal Application Timing
            </h3>
            {metrics.bestApplicationDays.length > 0 ? (
              <>
                <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
                  {metrics.bestApplicationDays.slice(0, 3).map((day, idx) => (
                    <div key={day.day} style={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      padding: "12px",
                      background: idx === 0 ? "#e8f5e9" : "#f5f5f5",
                      borderRadius: "6px",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: "600" }}>
                        {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : '🥉 '}{day.day}
                      </span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: "bold", color: idx === 0 ? "#4caf50" : "#666" }}>
                          {day.successRate}%
                        </div>
                        <div style={{ fontSize: "12px", color: "#999" }}>
                          {day.total} applications
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "12px", background: "#e3f2fd", borderRadius: "6px", fontSize: "13px" }}>
                  💡 <strong>Recommendation:</strong> Based on your data, {metrics.bestApplicationDays[0].day} is your most successful application day.
                  {metrics.bestApplicationDays[0].total < 10 && " (Limited data - continue tracking for better insights)"}
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                Need at least 3 applications per day for timing analysis
              </div>
            )}
          </div>

          {/* Success by Role Type */}
          <div style={{ background: "white", padding: "20px", marginTop: "1px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", color: "#333", marginBottom: "16px" }}>
              💼 Success Rate by Role Level
            </h3>
            {metrics.roleTypeSuccessRates.length > 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {metrics.roleTypeSuccessRates.map((role, idx) => (
                  <div key={role.role} style={{ 
                    padding: "16px", 
                    background: "#f9f9f9", 
                    borderRadius: "8px",
                    borderLeft: `4px solid ${idx === 0 ? '#9c27b0' : '#673ab7'}`
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "16px", fontWeight: "600", color: "#333" }}>
                          {role.role}
                        </span>
                        <span style={{ fontSize: "13px", color: "#666", marginLeft: "8px" }}>
                          ({role.successful}/{role.total} applications)
                        </span>
                      </div>
                      <span style={{ fontSize: "20px", fontWeight: "bold", color: "#9c27b0" }}>
                        {role.successRate}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#e0e0e0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        width: `${role.successRate}%`,
                        height: "100%",
                        background: idx === 0 ? '#9c27b0' : '#673ab7',
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                Add more applications to analyze role-level success patterns
              </div>
            )}
          </div>

          {/* Statistical Significance Notice */}
          <div style={{ 
            background: "white", 
            padding: "20px", 
            marginTop: "1px",
            borderRadius: "0 0 8px 8px", 
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
          }}>
            <div style={{ 
              padding: "16px", 
              background: "#fff8e1", 
              borderRadius: "8px",
              borderLeft: "4px solid #ffc107"
            }}>
              <h4 style={{ marginTop: 0, fontSize: "15px", color: "#f57c00", marginBottom: "8px" }}>
                📊 About Statistical Significance
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#666", lineHeight: "1.6" }}>
                Insights shown above only include patterns with sufficient data (typically 3+ data points per category).
                As you add more applications, these analyses become more accurate and reliable.
                Recommendations marked "High Confidence" are based on 10+ data points with strong statistical patterns.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}