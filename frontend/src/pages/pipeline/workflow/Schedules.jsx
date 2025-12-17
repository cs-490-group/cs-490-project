import React from "react";
import { safeId } from "./helpers";
import ApplicationWorkflowAPI from "../../../api/applicationWorkflow";
import ResumesAPI from "../../../api/resumes";
import CoverLetterAPI from "../../../api/coverLetters";
import JobsAPI from "../../../api/jobs";


export default function SchedulesTab({
  schedules,
  jobs,
  packages,

  scheduleJobId,
  schedulePackageId,
  scheduleTime,

  setScheduleJobId,
  setSchedulePackageId,
  setScheduleTime,

  createSchedule,
  cancelSchedule
}) {
  return (
    <div className="row g-3 mb-4">
      {/* Left — Schedule Form */}
      <div className="col-lg-6">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5>Schedule Application</h5>

            <form onSubmit={createSchedule} className="row g-2 mt-2">
              <select
                className="form-select"
                value={scheduleJobId}
                onChange={(e) => setScheduleJobId(e.target.value)}
                aria-label="Select job to schedule application for"
              >
                <option value="">Select Job</option>
                {jobs.map((j, i) => (
                  <option key={i} value={safeId(j)}>
                    {j.title} @ {
                      typeof j.company === "string"
                        ? j.company
                        : j.company?.name ||
                          j.company?.industry ||
                          j.company?.location ||
                          "Unknown Company"
                      }
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                value={schedulePackageId}
                onChange={(e) => setSchedulePackageId(e.target.value)}
                aria-label="Select package for scheduled application"
              >
                <option value="">Select Package</option>
                {packages.map((p, i) => (
                  <option key={i} value={safeId(p)}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                className="form-control"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />

              <button type="submit" className="btn btn-primary mt-2">
                Schedule
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right — Upcoming schedules */}
      <div className="col-lg-6">
        <h5 className="mb-3">Upcoming Scheduled Applications</h5>

        {schedules.length === 0 ? (
          <div className="border rounded p-3 text-muted">
            No scheduled applications yet.
          </div>
        ) : (
          <ul className="list-group">
            {schedules.map((s, i) => (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>
                    {new Date(s.scheduled_time || s.run_at).toLocaleString()}
                  </strong>
                  <br />
                  <small className="text-muted">
                    Status: {s.status || "scheduled"}
                  </small>
                </div>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => cancelSchedule(safeId(s), s.job_id)}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
