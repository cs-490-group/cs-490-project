import React, { useState, useEffect } from 'react';
import ResumesAPI from '../api/resumes';

export default function ReviewImpactWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await ResumesAPI.getReviewImpact();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load with error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="p-3 text-center text-muted">Calculating impact...</div>;
  if (!stats) return null;

  const isPositive = stats.lift >= 0;

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ background: "linear-gradient(to right, #ffffff, #f8f9fa)" }}>
      <div className="card-body p-4">
        <h4 className="card-title fw-bold mb-4 d-flex align-items-center">
          Review Impact Analysis
        </h4>

        <div className="row g-4 text-center">
          {/* Reviewed Stats */}
          <div className="col-md-4">
            <div className="p-3 rounded-3 bg-white border border-success border-opacity-25 shadow-sm">
              <div className="text-success fw-bold text-uppercase small mb-1">
                Reviewed Resumes
              </div>
              <div className="display-6 fw-bold text-dark">{stats.reviewed.success_rate}%</div>
              <div className="text-muted small">Success Rate</div>
              <div className="mt-2 badge bg-success bg-opacity-10 text-success">
                {stats.reviewed.count} Applications
              </div>
            </div>
          </div>

          <div className="col-md-4 d-flex flex-column justify-content-center align-items-center">
            <div className={`display-5 fw-bold ${isPositive ? 'text-success' : 'text-secondary'}`}>
              {isPositive ? '+' : ''}{stats.lift.toFixed(1)}%
            </div>
            <div className="text-muted fw-medium">Success Boost</div>
            <p className="small text-muted mt-2 px-2">
              {isPositive 
                ? "Your reviews have increased the overall success of your resumes." 
                : "Keep gathering feedback to improve resume results."}
            </p>
          </div>

          {/* Unreviewed Stats */}
          <div className="col-md-4">
            <div className="p-3 rounded-3 bg-white border border-secondary border-opacity-10 shadow-sm">
              <div className="text-secondary fw-bold text-uppercase small mb-1">
                Unreviewed Resumes
              </div>
              <div className="display-6 fw-bold text-secondary">{stats.unreviewed.success_rate}%</div>
              <div className="text-muted small">Success Rate</div>
              <div className="mt-2 badge bg-secondary bg-opacity-10 text-secondary">
                {stats.unreviewed.count} Applications
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}