import React, { useEffect, useState } from "react";

/* ======================================================
   JOB REQUIREMENTS MATCH ANALYSIS
====================================================== */
export default function JobMatchingPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const uuid = localStorage.getItem("uuid");
  const session = localStorage.getItem("session");

  /* -------------------------
     Helpers
  ------------------------- */
  const getScoreColor = (score) => {
    if (score >= 80) return "#2e7d32"; // green
    if (score >= 60) return "#ed6c02"; // orange
    return "#d32f2f"; // red
  };

  /* -------------------------
     Fetch Matches
  ------------------------- */
  const fetchMatches = async () => {
    if (!uuid || !session) return;

    setLoading(true);
    try {
      const res = await fetch("https://cs-490-project-production.up.railway.app/", {
        headers: {
          "Content-Type": "application/json",
          uuid,
          Authorization: `Bearer ${session}`,
        },
      });

      if (!res.ok) {
        setMatches([]);
        return;
      }

      setMatches(await res.json());
    } catch (err) {
      console.error("Failed to load matches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  /* -------------------------
     Buckets (SORTED)
  ------------------------- */
  const noRequirements = matches.filter(
    (m) => !m.skills?.details || m.skills.details.length === 0
  );

  const strong = matches
    .filter((m) => m.overallScore >= 80 && m.skills?.details?.length > 0)
    .sort((a, b) => b.overallScore - a.overallScore);

  const medium = matches
    .filter(
      (m) =>
        m.overallScore >= 60 &&
        m.overallScore < 80 &&
        m.skills?.details?.length > 0
    )
    .sort((a, b) => b.overallScore - a.overallScore);

  const weak = matches
    .filter((m) => m.overallScore < 60 && m.skills?.details?.length > 0)
    .sort((a, b) => b.overallScore - a.overallScore);

  /* -------------------------
     Card Renderer
  ------------------------- */
  const renderCard = (m) => {
    /* Auto-generated improvements */
    const improvements = [];

    if (m.skills?.missing?.length > 0) {
      improvements.push(
        `Build hands-on experience with ${m.skills.missing
          .slice(0, 3)
          .join(", ")} through projects, coursework, or internships.`
      );
    }

    if (m.experience?.score < 70) {
      improvements.push(
        "Strengthen relevant experience through internships, research, or applied projects."
      );
    }

    if (m.education?.score < 70) {
      improvements.push(
        "Consider certifications or targeted coursework to strengthen academic alignment."
      );
    }

    return (
      <div className="col-md-6" key={m.jobId}>
        <div
          className="card h-100"
          onClick={() => setSelectedJobId(m.jobId)}
          style={{
            cursor: "pointer",
            border:
              selectedJobId === m.jobId
                ? "3px solid #4caf50"
                : "1px solid #ddd",
            boxShadow:
              selectedJobId === m.jobId
                ? "0 0 10px rgba(76,175,80,0.4)"
                : "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div className="card-body">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="mb-0">{m.jobTitle}</h5>
                <small className="text-muted">
                  {typeof m.company === "object"
                    ? m.company?.name || "Company"
                    : m.company}
                </small>
              </div>

              <div
                style={{
                  background: getScoreColor(m.overallScore),
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: "999px",
                  fontWeight: "bold",
                }}
              >
                {m.overallScore}%
              </div>
            </div>

            {/* Skills */}
            <div className="mt-2">
              <strong>Skills:</strong>
              <div className="d-flex gap-2 flex-wrap mt-2 mb-3">
                {m.skills?.matching?.map((skill) => (
                  <span
                    key={skill}
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: "#2e7d32",
                      color: "white",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}

                {m.skills?.missing?.map((skill) => (
                  <span
                    key={skill}
                    className="badge rounded-pill"
                    style={{
                      backgroundColor: "#d32f2f",
                      color: "white",
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                    }}
                  >
                    ✗ {skill}
                  </span>
                ))}

                {!m.skills?.matching?.length &&
                  !m.skills?.missing?.length && (
                    <span className="text-muted small">
                      No listed requirements
                    </span>
                  )}
              </div>
            </div>

            {/* Strengths */}
            {m.skills?.matching?.length > 0 && (
              <div
                className="p-2 rounded mb-3"
                style={{
                  background: "#f1f8f4",
                  borderLeft: "4px solid #2e7d32",
                }}
              >
                <div className="fw-semibold small text-success mb-1">
                  ✅ Strengths
                </div>
                <div className="small text-muted">
                  Strong alignment in{" "}
                  {m.skills.matching.slice(0, 3).join(", ")}
                  {m.skills.matching.length > 3 && " and related skills"}.
                </div>
              </div>
            )}

            {/* Qualification Match */}
            <div className="p-2 rounded mb-3" style={{ background: "#f8f9fa" }}>
              <div className="fw-semibold small mb-2 text-secondary">
                Qualification Match
              </div>

              <div className="small d-flex flex-column gap-2">
                <div>
                  🧠 <strong>Experience:</strong>{" "}
                  {m.experience?.userYears || 0} yrs{" "}
                  {m.experience?.userYears >=
                  (m.experience?.requiredMin || 0) ? (
                    <span className="text-success">✓ Meets / Exceeds</span>
                  ) : (
                    <span className="text-danger">✗ Below</span>
                  )}
                  <div className="text-muted small ms-4">
                    Role requires {m.experience?.requiredMin || 0} yrs.
                    Internships and projects count toward this total.
                  </div>
                </div>

                <div>
                  🎓 <strong>Education:</strong>{" "}
                  {m.education?.userLevel || "None"}{" "}
                  {m.education?.score === 100 ? (
                    <span className="text-success">✓ Meets</span>
                  ) : (
                    <span className="text-warning">⚠ Below</span>
                  )}
                  <div className="text-muted small ms-4">
                    Expected: {m.education?.requiredLevel || "Not specified"}.
                    Equivalent coursework or certifications may qualify.
                  </div>
                </div>

                {m.experience?.level && (
                  <div>
                    🧩 <strong>Level:</strong>{" "}
                    {m.experience.level.user} →{" "}
                    {m.experience.level.required}
                    <div className="text-muted small ms-4">
                      Based on years of experience and role seniority.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Focus Areas */}
            {improvements.length > 0 && (
              <div
                className="p-3 rounded mb-3"
                style={{
                  background: "#eef5ff",
                  borderLeft: "4px solid #3f8cff",
                }}
              >
                <div className="fw-semibold small mb-2 text-primary">
                  🎯 Recommended Focus Areas
                </div>
                <ul className="small mb-0 ps-3">
                  {improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mt-2">
              <summary className="text-primary small">Why this score?</summary>
              <div className="small mt-1">
                <div>Skills: {m.categoryBreakdown?.skills}%</div>
                <div>Experience: {m.categoryBreakdown?.experience}%</div>
                <div>Education: {m.categoryBreakdown?.education}%</div>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="container py-4">
      <div className="mb-4 text-center">
        <h2 className="text-white fw-bold">Job Requirements Match Analysis</h2>
        <p className="text-white-50 mb-0">
          Compare your skills, experience, and education against each role
        </p>

        <div
          style={{
            width: "80px",
            height: "4px",
            background: "linear-gradient(90deg, #00c6ff, #00e676)",
            borderRadius: "999px",
            margin: "12px auto 24px",
          }}
        />
      </div>

      {loading && <p className="text-white">Loading matches…</p>}

      {!loading && (
        <>
          {strong.length > 0 && (
            <>
              <h5 className="text-white mt-4">🔥 Strong Matches</h5>
              <hr className="border-light opacity-25" />
              <div className="row gy-3">{strong.map(renderCard)}</div>
            </>
          )}

          {medium.length > 0 && (
            <>
              <h5 className="text-white mt-4">⚠️ Possible Matches</h5>
              <hr className="border-light opacity-25" />
              <div className="row gy-3">{medium.map(renderCard)}</div>
            </>
          )}

          {weak.length > 0 && (
            <>
              <h5 className="text-white mt-4">❌ Weak Matches</h5>
              <hr className="border-light opacity-25" />
              <div className="row gy-3">{weak.map(renderCard)}</div>
            </>
          )}

          {noRequirements.length > 0 && (
            <>
              <h5 className="text-white mt-4">📄 No Requirements Listed</h5>
              <p className="text-white-50 small">
                These roles don’t list required skills, so the match score is
                based on experience and education only.
              </p>
              <hr className="border-light opacity-25" />
              <div className="row gy-3">
                {noRequirements.map(renderCard)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}


