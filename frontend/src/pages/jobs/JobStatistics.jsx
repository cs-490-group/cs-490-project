import React, { useMemo } from "react";

export default function JobStatistics({ jobs }) {
  const stats = useMemo(() => {
    // Status counts
    const statusCounts = {
      Interested: 0,
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0
    };

    jobs.forEach(job => {
      if (!job.archived && statusCounts.hasOwnProperty(job.status)) {
        statusCounts[job.status]++;
      }
    });

    // Response rate (Applied -> any further stage)
    const applied = statusCounts.Applied + statusCounts.Screening + statusCounts.Interview + statusCounts.Offer + statusCounts.Rejected;
    const responded = statusCounts.Screening + statusCounts.Interview + statusCounts.Offer + statusCounts.Rejected;
    const responseRate = applied > 0 ? ((responded / applied) * 100).toFixed(1) : 0;

    // Success rate (Applied -> Offer)
    const successRate = applied > 0 ? ((statusCounts.Offer / applied) * 100).toFixed(1) : 0;

    // Interview rate (Applied -> Interview or beyond)
    const interviewed = statusCounts.Interview + statusCounts.Offer;
    const interviewRate = applied > 0 ? ((interviewed / applied) * 100).toFixed(1) : 0;

    // Average time in each stage
    const stageTimes = {};
    const stageCounts = {};

    jobs.forEach(job => {
      if (job.statusHistory && job.statusHistory.length > 1) {
        for (let i = 0; i < job.statusHistory.length - 1; i++) {
          const currentStage = job.statusHistory[i].status;
          const nextStageTime = new Date(job.statusHistory[i + 1].timestamp);
          const currentStageTime = new Date(job.statusHistory[i].timestamp);
          const daysInStage = Math.floor((nextStageTime - currentStageTime) / (1000 * 60 * 60 * 24));

          if (!stageTimes[currentStage]) {
            stageTimes[currentStage] = 0;
            stageCounts[currentStage] = 0;
          }
          stageTimes[currentStage] += daysInStage;
          stageCounts[currentStage]++;
        }
      }
    });

    const avgStageTimes = {};
    Object.keys(stageTimes).forEach(stage => {
      avgStageTimes[stage] = Math.round(stageTimes[stage] / stageCounts[stage]);
    });

    // Monthly application volume
    const monthlyVolume = {};
    jobs.forEach(job => {
      if (!job.archived && job.createdAt) {
        const date = new Date(job.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + 1;
      }
    });

    const sortedMonths = Object.keys(monthlyVolume).sort();
    const monthlyData = sortedMonths.map(month => ({
      month,
      count: monthlyVolume[month]
    }));

    // Deadline adherence
    let totalDeadlines = 0;
    let metDeadlines = 0;
    
    jobs.forEach(job => {
      if (job.deadline && !job.archived) {
        totalDeadlines++;
        const deadlineDate = new Date(job.deadline);
        const appliedDate = job.statusHistory?.find(h => h.status === 'Applied');
        if (appliedDate) {
          const applied = new Date(appliedDate.timestamp);
          if (applied <= deadlineDate) {
            metDeadlines++;
          }
        }
      }
    });

    const deadlineAdherence = totalDeadlines > 0 ? ((metDeadlines / totalDeadlines) * 100).toFixed(1) : 0;

    // Time to offer
    const timeToOfferDays = [];
    jobs.forEach(job => {
      if (job.status === 'Offer' && job.statusHistory && job.statusHistory.length > 0) {
        const firstStatus = new Date(job.statusHistory[0].timestamp);
        const offerStatus = job.statusHistory.find(h => h.status === 'Offer');
        if (offerStatus) {
          const offerDate = new Date(offerStatus.timestamp);
          const days = Math.floor((offerDate - firstStatus) / (1000 * 60 * 60 * 24));
          timeToOfferDays.push(days);
        }
      }
    });

    const avgTimeToOffer = timeToOfferDays.length > 0
      ? Math.round(timeToOfferDays.reduce((a, b) => a + b, 0) / timeToOfferDays.length)
      : 0;

    return {
      statusCounts,
      totalActive: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      totalArchived: jobs.filter(j => j.archived).length,
      responseRate,
      successRate,
      interviewRate,
      avgStageTimes,
      monthlyData,
      deadlineAdherence,
      totalDeadlines,
      metDeadlines,
      avgTimeToOffer,
      offerCount: timeToOfferDays.length
    };
  }, [jobs]);

  const exportToCSV = () => {
    const csvData = [
      ['Job Search Statistics Report', ''],
      ['Generated', new Date().toLocaleDateString()],
      ['', ''],
      ['Overall Statistics', ''],
      ['Total Active Jobs', stats.totalActive],
      ['Total Archived Jobs', stats.totalArchived],
      ['Response Rate', `${stats.responseRate}%`],
      ['Success Rate (Offers)', `${stats.successRate}%`],
      ['Interview Rate', `${stats.interviewRate}%`],
      ['Avg Time to Offer', `${stats.avgTimeToOffer} days`],
      ['Deadline Adherence', `${stats.deadlineAdherence}%`],
      ['', ''],
      ['Jobs by Status', ''],
      ['Status', 'Count'],
      ...Object.entries(stats.statusCounts).map(([status, count]) => [status, count]),
      ['', ''],
      ['Average Days in Each Stage', ''],
      ['Stage', 'Average Days'],
      ...Object.entries(stats.avgStageTimes).map(([stage, days]) => [stage, days]),
      ['', ''],
      ['Monthly Application Volume', ''],
      ['Month', 'Applications'],
      ...stats.monthlyData.map(d => [d.month, d.count])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-search-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatCard = ({ title, value, subtitle, color = "#4f8ef7", icon }) => (
    <div style={{
      background: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "13px", color: "#999" }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#333" }}>📊 Job Search Analytics</h2>
        <button
          onClick={exportToCSV}
          style={{
            padding: "10px 20px",
            background: "#34c759",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px"
          }}
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard
          title="Total Active Jobs"
          value={stats.totalActive}
          subtitle={`${stats.totalArchived} archived`}
          color="#4f8ef7"
          icon="📋"
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          subtitle="Companies that responded"
          color="#2196f3"
          icon="📧"
        />
        <StatCard
          title="Interview Rate"
          value={`${stats.interviewRate}%`}
          subtitle="Applications → Interviews"
          color="#ff9800"
          icon="💼"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          subtitle="Applications → Offers"
          color="#4caf50"
          icon="🎉"
        />
      </div>

      {/* Status Breakdown */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>Jobs by Status</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          {Object.entries(stats.statusCounts).map(([status, count]) => {
            const colors = {
              Interested: "#9e9e9e",
              Applied: "#2196f3",
              Screening: "#ff9800",
              Interview: "#ff5722",
              Offer: "#4caf50",
              Rejected: "#f44336"
            };
            const percentage = stats.totalActive > 0 ? ((count / stats.totalActive) * 100).toFixed(1) : 0;
            return (
              <div key={status} style={{
                padding: "16px",
                background: "#f9f9f9",
                borderRadius: "6px",
                borderLeft: `4px solid ${colors[status]}`
              }}>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{status}</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#333", marginBottom: "4px" }}>
                  {count}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>{percentage}% of total</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Average Time in Stage */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>⏱️ Average Time in Each Stage</h3>
        {Object.keys(stats.avgStageTimes).length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {Object.entries(stats.avgStageTimes).map(([stage, days]) => (
              <div key={stage} style={{ padding: "12px", background: "#f9f9f9", borderRadius: "6px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                  {stage}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#4f8ef7" }}>
                  {days} {days === 1 ? 'day' : 'days'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
            Not enough data yet. Status changes will be tracked over time.
          </div>
        )}
      </div>

      {/* Monthly Application Volume Chart */}
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>📈 Monthly Application Volume</h3>
        {stats.monthlyData.length > 0 ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "200px", marginTop: "16px" }}>
            {stats.monthlyData.map(data => {
              const maxCount = Math.max(...stats.monthlyData.map(d => d.count));
              const height = (data.count / maxCount) * 160;
              return (
                <div key={data.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "4px" }}>
                    {data.count}
                  </div>
                  <div style={{
                    width: "100%",
                    height: `${height}px`,
                    background: "linear-gradient(to top, #4f8ef7, #2196f3)",
                    borderRadius: "4px 4px 0 0",
                    minHeight: "20px"
                  }} />
                  <div style={{ fontSize: "11px", color: "#666", marginTop: "8px", transform: "rotate(-45deg)", transformOrigin: "center" }}>
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
            No application data yet
          </div>
        )}
      </div>

      {/* Deadline Tracking */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>📅 Deadline Adherence</h3>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "#4caf50", textAlign: "center", margin: "20px 0" }}>
            {stats.deadlineAdherence}%
          </div>
          <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
            {stats.metDeadlines} of {stats.totalDeadlines} applications submitted before deadline
          </div>
        </div>

        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginTop: 0, color: "#333", fontSize: "18px" }}>🎯 Time to Offer</h3>
          <div style={{ fontSize: "48px", fontWeight: "bold", color: "#ff9800", textAlign: "center", margin: "20px 0" }}>
            {stats.avgTimeToOffer}
          </div>
          <div style={{ fontSize: "14px", color: "#666", textAlign: "center" }}>
            average days from first contact to offer ({stats.offerCount} {stats.offerCount === 1 ? 'offer' : 'offers'})
          </div>
        </div>
      </div>

      {/* Insights */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px", borderRadius: "8px", color: "white" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px" }}>💡 Insights & Recommendations</h3>
        <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "14px", lineHeight: "1.8" }}>
          {stats.responseRate < 30 && (
            <li>Your response rate is below average. Consider tailoring your applications more specifically to each role.</li>
          )}
          {stats.interviewRate > 40 && (
            <li>Excellent interview conversion rate! Your applications are resonating with employers.</li>
          )}
          {stats.deadlineAdherence < 70 && (
            <li>Consider applying earlier to improve your deadline adherence and show enthusiasm.</li>
          )}
          {stats.avgTimeToOffer > 60 && stats.offerCount > 0 && (
            <li>The hiring process is taking longer than average. Stay patient and follow up regularly.</li>
          )}
          {stats.statusCounts.Interested > stats.statusCounts.Applied * 2 && (
            <li>You have many jobs marked as "Interested". Consider applying to more positions to increase your chances.</li>
          )}
          {stats.monthlyData.length > 2 && stats.monthlyData[stats.monthlyData.length - 1].count < stats.monthlyData[stats.monthlyData.length - 2].count && (
            <li>Your application volume decreased this month. Consistency is key in job searching!</li>
          )}
        </ul>
      </div>
    </div>
  );
}