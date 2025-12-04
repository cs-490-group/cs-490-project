// src/pages/jobs/SkillsGapPage.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function SkillsGapPage() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGap = async () => {
    setLoading(true);
    try {
      const uuid = localStorage.getItem("uuid");
      const token = localStorage.getItem("session");

      if (!uuid || !token) {
        console.error("Missing uuid or session token");
        return;
      }

      const res = await fetch(
        `http://localhost:8000/matching/skills-gap/${jobId}`,
        {
          method: "GET",
          headers: {
            uuid: uuid,
            authorization: "Bearer " + token,
          },
        }
      );

      if (!res.ok) {
        console.error("Backend error:", await res.text());
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load skills gap", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGap();
  }, [jobId]);

  // 🚨 Prevents “Cannot read properties of null”
  if (loading || !data) {
    return (
      <div className="container py-4">
        <h2>Skills Gap Analysis</h2>
        <p className="text-muted">Loading comparison...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2>Skills Gap Analysis</h2>
      <p className="text-muted">
        {data.jobTitle} · {data.company}
      </p>

      <div className="card mb-3">
        <div className="card-body">
          <h5>Skills match score</h5>
          <p className="fs-4 mb-0">{data.skillsMatchScore}%</p>
        </div>
      </div>

      <div className="row gy-3">
        {/* Strengths */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5>Strengths</h5>
              {data.strengths.length === 0 && (
                <p className="text-muted">No strong skills yet.</p>
              )}
              {data.strengths.length > 0 && (
                <ul>
                  {data.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Gaps */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h5>Gaps / Weak Skills</h5>
              {data.gaps.length === 0 && (
                <p className="text-muted">No gaps detected 🎉</p>
              )}
              {data.gaps.length > 0 && (
                <ul>
                  {data.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skill details */}
      <div className="card mt-3">
        <div className="card-body">
          <h5>Skill details</h5>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Required level</th>
                  <th>Your level</th>
                  <th>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {data.skillDetails.map((d) => (
                  <tr key={d.skill}>
                    <td>{d.skill}</td>
                    <td>{d.requiredLevel}</td>
                    <td>{d.userLevel}</td>
                    <td>{d.coverage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Learning plan */}
      <div className="card mt-3">
        <div className="card-body">
          <h5>Suggested learning plan</h5>
          {data.learningPlan.length === 0 && (
            <p className="text-muted">
              No learning suggestions – your skills already fully match this role.
            </p>
          )}

          {data.learningPlan.length > 0 && (
            <ol>
              {data.learningPlan.map((item) => (
                <li key={item.skill}>
                  <strong>{item.skill}</strong> – priority {item.priority}
                  <ul className="small text-muted mb-2">
                    {item.suggestedSources.map((src, idx) => (
                      <li key={idx}>{src}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

