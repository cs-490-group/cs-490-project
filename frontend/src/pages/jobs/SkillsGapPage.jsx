// src/pages/jobs/SkillsGapPage.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProgressBar, Badge } from "react-bootstrap";

export default function SkillsGapPage() {
  const { jobId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGap = async () => {
    setLoading(true);
    try {
      const uuid = localStorage.getItem("uuid");
      const token = localStorage.getItem("session");

      const res = await fetch(
        `http://localhost:8000/matching/skills-gap/${jobId}`,
        {
          headers: {
            uuid,
            authorization: "Bearer " + token,
          },
        }
      );

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

  if (loading || !data) {
    return (
      <div className="container py-5 text-center">
        <h4>Analyzing skill gaps…</h4>
        <p className="text-muted">Comparing your skills to this role</p>
      </div>
    );
  }

  /* -------------------------
     Helpers
  ------------------------- */
  const scoreVariant =
    data.skillsMatchScore >= 75
      ? "success"
      : data.skillsMatchScore >= 40
      ? "warning"
      : "danger";

  return (
    <div className="container py-5">
      {/* ================= HEADER ================= */}
      <div className="text-center mb-5">
  <h2 className="fw-bold text-white">
    Skills Gap Analysis
  </h2>

  <p
    className="mb-1"
    style={{
      color: "rgba(255,255,255,0.85)",
      fontSize: "1rem",
    }}
  >
    How your current skills compare to this role — and what to improve next
  </p>

  <p
    className="mb-2"
    style={{
      color: "rgba(255,255,255,0.65)",
      fontSize: "0.9rem",
    }}
  >
    {data.jobTitle} · {data.company}
  </p>

  <div
    style={{
      width: "70px",
      height: "4px",
      background: "linear-gradient(90deg, #00e676, #00c6ff)",
      borderRadius: "999px",
      margin: "12px auto 0",
    }}
  />
  </div>

      {/* ================= SCORE ================= */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Skills Match Score</h5>
            <strong>{data.skillsMatchScore}%</strong>
          </div>
          <ProgressBar
            now={data.skillsMatchScore}
            variant={scoreVariant}
            animated
          />
          <small className="text-muted d-block mt-2">
            This score reflects how well your current skills match this role’s requirements.
          </small>
        </div>
      </div>

      {/* ================= STRENGTHS & GAPS ================= */}
      <div className="row g-3 mb-4">
        {/* Strengths */}
        <div className="col-md-6">
          <div className="card h-100 border-success">
            <div className="card-body">
              <h5 className="text-success">✅ Strengths</h5>

              {data.strengths.length === 0 ? (
                <p className="text-muted">
                  No strong matches yet — this is a good place to start building.
                </p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {data.strengths.map((s) => (
                    <Badge key={s} bg="success">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gaps */}
        <div className="col-md-6">
          <div className="card h-100 border-danger">
            <div className="card-body">
              <h5 className="text-danger">⚠ Skill Gaps</h5>

              {data.gaps.length === 0 ? (
                <p className="text-muted">No gaps detected 🎉</p>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {data.gaps.map((g) => (
                    <Badge key={g} bg="danger">
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SKILL DETAILS ================= */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Skill Coverage Breakdown</h5>

          {data.skillDetails.map((d) => (
            <div key={d.skill} className="mb-3">
              <div className="d-flex justify-content-between">
                <strong>{d.skill}</strong>
                <small>{d.coverage}%</small>
              </div>

              <ProgressBar
                now={d.coverage}
                variant={
                  d.coverage >= 75
                    ? "success"
                    : d.coverage >= 40
                    ? "warning"
                    : "danger"
                }
              />

              <small className="text-muted">
                Required level: {d.requiredLevel} · Your level: {d.userLevel}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* ================= LEARNING PLAN ================= */}
<div className="card">
  <div className="card-body">
    <h5 className="fw-bold mb-1">🎯 Your Personalized Learning Plan</h5>

    <p className="text-muted mb-4">
      Based on your skill gaps, this plan focuses on what will most improve
      your chances for this role.
    </p>

    {data.learningPlan.length === 0 ? (
      <p className="text-muted">
        You’re well-aligned — no immediate learning gaps detected 🎉
      </p>
    ) : (
      <div className="d-flex flex-column gap-3">
        {data.learningPlan.map((item) => {
          const priorityLabel =
            item.priority >= 80
              ? "🔥 High Priority"
              : item.priority >= 50
              ? "⭐ Medium Priority"
              : "⏳ Optional";

          const priorityVariant =
            item.priority >= 80
              ? "danger"
              : item.priority >= 50
              ? "warning"
              : "secondary";

          return (
            <div
              key={item.skill}
              className="p-4 rounded border"
              style={{ background: "#ffffff" }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold mb-1 text-capitalize">
                    {item.skill}
                  </h5>
                  <small className="text-muted">
                    Required for this role but missing or underdeveloped
                  </small>
                </div>

                <Badge bg={priorityVariant}>
                  {priorityLabel}
                </Badge>
              </div>

              <hr className="my-3" />

              {/* Focus Area */}
              <div className="mb-3">
                <strong className="d-block mb-2">What to focus on</strong>
                <ul className="mb-0 text-muted">
                  {item.suggestedSources.slice(0, 3).map((src, idx) => (
                    <li key={idx}>{src}</li>
                  ))}
                </ul>
              </div>

              {/* Outcome */}
              <div className="d-flex align-items-start gap-2 text-success mb-3">
                <span>✅</span>
                <small>
                  You’re job-ready when you can confidently use{" "}
                  <strong>{item.skill}</strong> in real projects.
                </small>
              </div>

              {/* CTA */}
              <div className="text-end">
                <button
                  className="btn btn-primary px-4"
                  onClick={() =>
                    alert(`Start learning plan for ${item.skill}`)
                  }
                >
                  Start {item.skill} Plan →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

    </div>
  );
}


