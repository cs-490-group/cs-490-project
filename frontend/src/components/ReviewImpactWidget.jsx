import React, { useState, useEffect } from 'react';
import ResumesAPI from '../api/resumes';
import teamsAPI from '../api/teams';

// Define defaults OUTSIDE the component to ensure they are always available
const DEFAULT_STATS = {
  lift: 0,
  reviewed: { success_rate: 0, count: 0 },
  unreviewed: { success_rate: 0, count: 0 }
};

export default function ReviewImpactWidget({ teamId }) {
  // Initialize with DEFAULT_STATS so it never reads "undefined"
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        let res;
        if (teamId) {
          res = await teamsAPI.getReviewImpact(teamId);
        } else {
          res = await ResumesAPI.getReviewImpact();
        }
        
        if (isMounted) {
          const data = res.data || res;
          // Check if data has the required shape, otherwise use defaults
          if (data && typeof data.lift !== 'undefined') {
            setStats(data);
          } else {
            console.warn("Impact data missing expected fields, using defaults");
            setStats(DEFAULT_STATS);
          }
        }
      } catch (err) {
        console.error("Failed to load impact stats:", err);
        if (isMounted) setStats(DEFAULT_STATS);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    loadStats();

    return () => { isMounted = false; };
  }, [teamId]);

  if (loading) {
    return <div className="p-3 text-center text-muted">Calculating impact...</div>;
  }

  // Ensure we rely on the state (which is initialized), but add a safety check
  const displayStats = stats || DEFAULT_STATS;
  const isPositive = (displayStats.lift || 0) >= 0;
  
  // Dynamic text based on context
  const successMessage = teamId 
    ? "Your reviews have increased the overall success of your candidates."
    : "Your reviews have increased the overall success of your resumes.";

  const encouragementMessage = teamId
    ? "Review more candidate resumes to improve team results."
    : "Keep gathering feedback to improve resume results.";

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(to right, #ffffff, #f8f9fa)" }}>
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-4 d-flex align-items-center">
          {teamId ? "Team Review Impact" : "Review Impact Analysis"}
        </h4>

        <div className="row g-4 text-center">
          {/* Reviewed Stats */}
          <div className="col-md-4">
            <div className="p-3 rounded-3 bg-white border border-success border-opacity-25 shadow-sm">
              <div className="text-success fw-bold text-uppercase small mb-1">
                Reviewed Resumes
              </div>
              <div className="display-6 fw-bold text-dark">
                {displayStats.reviewed?.success_rate || 0}%
              </div>
              <div className="text-muted small">Success Rate</div>
              <div className="mt-2 badge bg-success bg-opacity-10 text-success">
                {displayStats.reviewed?.count || 0} Applications
              </div>
            </div>
          </div>

          {/* Lift / Impact */}
          <div className="col-md-4 d-flex flex-column justify-content-center align-items-center">
            <div className={`display-5 fw-bold ${isPositive ? 'text-success' : 'text-secondary'}`}>
              {isPositive ? '+' : ''}{Number(displayStats.lift || 0).toFixed(1)}%
            </div>
            <div className="text-muted fw-medium">Improvement</div>
            <p className="small text-muted mt-2 px-2">
              {isPositive ? successMessage : encouragementMessage}
            </p>
          </div>

          {/* Unreviewed Stats */}
          <div className="col-md-4">
            <div className="p-3 rounded-3 bg-white border border-secondary border-opacity-10 shadow-sm">
              <div className="text-secondary fwa-bold text-uppercase small mb-1">
                Unreviewed Resumes
              </div>
              <div className="display-6 fw-bold text-secondary">
                {displayStats.unreviewed?.success_rate || 0}%
              </div>
              <div className="text-muted small">Success Rate</div>
              <div className="mt-2 badge bg-secondary bg-opacity-10 text-secondary">
                {displayStats.unreviewed?.count || 0} Applications
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}