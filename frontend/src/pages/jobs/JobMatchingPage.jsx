import React, { useEffect, useState } from "react";

// -------------------------
// MINI COMPARISON COMPONENT
// -------------------------
function JobComparisonPreview({ jobId }) {
  const [compare, setCompare] = useState(null);

  useEffect(() => {
    const uuid = localStorage.getItem("uuid");
    const session = localStorage.getItem("session");

    if (!uuid || !session) return;

    const load = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/matching/job-profile-compare/${jobId}`,
          {
            headers: {
              "Content-Type": "application/json",
              uuid,
              Authorization: `Bearer ${session}`,
            },
          }
        );

        if (res.ok) {
          setCompare(await res.json());
        }
      } catch (err) {
        console.error("Failed to load comparison preview", err);
      }
    };

    load();
  }, [jobId]);

  if (!compare)
    return <p className="text-muted small">Loading comparison…</p>;

  return (
    <div className="mt-2 small">
      <strong>Skills:</strong>
      <div>
        <span className="text-success">
          ✓ {compare.matchingSkills?.length ?? 0} match
        </span>{" "}
        <span className="text-warning">
          • {compare.partialSkills?.length ?? 0} partial
        </span>{" "}
        <span className="text-danger">
          • {compare.missingSkills?.length ?? 0} missing
        </span>
      </div>

      <div className="mt-2">
        <strong>Experience:</strong>{" "}
        {(compare.experienceGap?.user ?? 0)} yrs vs{" "}
        {(compare.experienceGap?.required ?? 0)} yrs
      </div>

      <div>
        <strong>Education:</strong>{" "}
        {(compare.educationGap?.user ?? "None")} vs{" "}
        {(compare.educationGap?.required ?? "None")}
      </div>
    </div>
  );
}

// ======================================================
// MAIN MATCHING PAGE
// ======================================================
export default function JobMatchingPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⭐ NEW — SELECTED JOB
  const [selectedJobId, setSelectedJobId] = useState(null);

  const uuid = localStorage.getItem("uuid");
  const session = localStorage.getItem("session");

  const [weights, setWeights] = useState({
    skillsWeight: 0.6,
    experienceWeight: 0.25,
    educationWeight: 0.15,
  });

  const fetchMatches = async () => {
    if (!uuid || !session) {
      console.warn("UUID or session missing — waiting...");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        skillsWeight: weights.skillsWeight,
        experienceWeight: weights.experienceWeight,
        educationWeight: weights.educationWeight,
      });

      const res = await fetch(
        `http://localhost:8000/matching/jobs?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            uuid,
            Authorization: `Bearer ${session}`,
          },
        }
      );

      if (!res.ok) {
        console.error("Backend returned error:", await res.text());
        setMatches([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error("Failed to load matches:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (uuid && session) {
      fetchMatches();
    }
  }, [uuid, session]);

  const handleWeightChange = (field, value) => {
    setWeights((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  return (
    <div className="container py-4">
      <h2 className="text-white">Job Match Analysis</h2>

      {/* Weight Controls */}
      <div className="card mb-3">
        <div className="card-body d-flex gap-3 flex-wrap">
          <div>
            <label>Skills weight</label>
            <input
              type="number"
              step="0.05"
              value={weights.skillsWeight}
              onChange={(e) =>
                handleWeightChange("skillsWeight", e.target.value)
              }
              className="form-control"
            />
          </div>

          <div>
            <label>Experience weight</label>
            <input
              type="number"
              step="0.05"
              value={weights.experienceWeight}
              onChange={(e) =>
                handleWeightChange("experienceWeight", e.target.value)
              }
              className="form-control"
            />
          </div>

          <div>
            <label>Education weight</label>
            <input
              type="number"
              step="0.05"
              value={weights.educationWeight}
              onChange={(e) =>
                handleWeightChange("educationWeight", e.target.value)
              }
              className="form-control"
            />
          </div>

          <button className="btn btn-primary ms-auto" onClick={fetchMatches}>
            Recalculate
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && <p className="text-white">Loading matches…</p>}
      {!loading && matches.length === 0 && (
        <p className="text-muted">No jobs found for matching.</p>
      )}

      <div className="row gy-3">
        {matches.map((m) => (
          <div className="col-md-6" key={m.jobId}>
            <div
              className="card h-100"
              onClick={() => {
                console.log("Job selected:", m.jobId);
                setSelectedJobId(m.jobId);
              }}
              style={{
                cursor: "pointer",
                border:
                  selectedJobId === m.jobId
                    ? "3px solid #4caf50"
                    : "1px solid #ddd",
                boxShadow:
                  selectedJobId === m.jobId
                    ? "0 0 10px rgba(76,175,80,0.5)"
                    : "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.15s ease",
              }}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <h5 className="card-title mb-0">{m.jobTitle}</h5>
                    <small className="text-muted">{m.company}</small>
                  </div>

                  <span className="badge bg-primary fs-6">
                    {m.overallScore}%
                  </span>
                </div>

                <JobComparisonPreview jobId={m.jobId} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}






