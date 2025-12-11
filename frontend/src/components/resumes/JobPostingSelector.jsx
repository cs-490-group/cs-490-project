/**
 * JobPostingSelector Component
 * Modal to select a job posting for AI features
 * Related to UC-047, UC-049, UC-050
 */

import React, { useState, useEffect } from 'react';
import JobsAPI from '../../api/jobs';

export default function JobPostingSelector({ onSelect, onClose }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await JobsAPI.getAll();
        setJobs(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load job postings. Please try again.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.company?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower)
    );
  });

  const handleJobSelect = (job) => {
    onSelect({
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      company: job.company || '',
      industry: job.industry || '',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content job-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select a Job Posting</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Search */}
          <div className="search-box mb-3">
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading job postings...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && jobs.length === 0 && (
            <div className="alert alert-info text-center py-5">
              <p>No job postings found. Create one in the Jobs section to get started with AI features.</p>
            </div>
          )}

          {/* Jobs list */}
          {!loading && !error && filteredJobs.length > 0 && (
            <div className="jobs-list">
              {filteredJobs.map((job) => (
                <div
                  key={job._id || job.id}
                  className="job-item"
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="job-item-header">
                    <h5 className="job-title">{job.title}</h5>
                    {job.company && <span className="badge bg-primary">{job.company}</span>}
                  </div>
                  {job.description && (
                    <p className="job-description text-muted">
                      {job.description.substring(0, 150)}
                      {job.description.length > 150 ? '...' : ''}
                    </p>
                  )}
                  <div className="job-meta">
                    {job.industry && <span className="meta-item">📊 {job.industry}</span>}
                    {job.salary && <span className="meta-item">💰 {job.salary}</span>}
                    {job.location && <span className="meta-item">📍 {job.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results state */}
          {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="alert alert-warning text-center py-5">
              <p>No job postings match your search. Try different keywords.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
