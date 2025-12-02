import React, { useState, useEffect } from "react";
import { Trophy, Heart, Sparkles } from "lucide-react";
import progressAPI from "../../api/progressSharing";

export default function MilestoneCelebration({ teamId, memberId, memberName }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(null);

  useEffect(() => {
    fetchMilestones();
  }, [memberId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const data = await progressAPI.getMilestones(teamId, memberId, 30);
      setMilestones(data.milestones || []);
    } catch (err) {
      console.error("Failed to fetch milestones", err);
    } finally {
      setLoading(false);
    }
  };

  const addCelebration = async (milestone) => {
    const emojis = ["🎉", "🚀", "⭐", "👏", "🎯"];
    const messages = [
      "Amazing work!",
      "You've got this!",
      "Keep it up!",
      "Way to go!",
      "Fantastic!"
    ];

    try {
      await progressAPI.addCelebration(teamId, memberId, {
        id: milestone.id,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      });
      fetchMilestones();
    } catch (err) {
      console.error("Failed to add celebration", err);
    }
  };

  return (
    <div style={{ background: "#fff8e1", padding: "24px", borderRadius: "8px", border: "1px solid #ffecb3", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Trophy size={24} color="#fbc02d" />
        <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#f57f17" }}>
          Recent Milestones
        </h2>
      </div>

      {loading ? (
        <div style={{ color: "#999" }}>Loading milestones...</div>
      ) : milestones.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {milestones.map((milestone, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #ffecb3",
                position: "relative"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                {milestone.category === "offer_received" && "💼"}
                {milestone.category === "interview_scheduled" && "📞"}
                {milestone.category === "goal_completed" && "✅"}
                {milestone.category === "offer_received" && "🎯"}
              </div>
              <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px", color: "#1a1a1a" }}>
                {milestone.title}
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
                {milestone.description}
              </div>
              <button
                onClick={() => addCelebration(milestone)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#fbc02d",
                  color: "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <Sparkles size={14} />
                Celebrate
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#999", padding: "24px" }}>
          <Heart size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
          <p>No milestones yet. Keep pushing forward! 🚀</p>
        </div>
      )}
    </div>
  );
}