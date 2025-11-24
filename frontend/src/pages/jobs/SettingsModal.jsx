import React from "react";

export default function SettingsModal({
  showSettings,
  setShowSettings,
  autoArchiveEnabled,
  setAutoArchiveEnabled,
  autoArchiveDays,
  setAutoArchiveDays,
  saveAutoArchiveSettings
}) {
  if (!showSettings) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px"
      }}
      onClick={() => setShowSettings(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "100%",
          padding: "24px"
        }}
      >
        <h2 style={{ marginTop: 0, color: "#333" }}>⚙️ Auto-Archive Settings</h2>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "16px" }}>
            <input
              type="checkbox"
              checked={autoArchiveEnabled}
              onChange={(e) => setAutoArchiveEnabled(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Enable automatic archiving</span>
          </label>
          
          {autoArchiveEnabled && (
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                Auto-archive jobs after (days):
              </label>
              <input
                type="number"
                value={autoArchiveDays}
                onChange={(e) => setAutoArchiveDays(parseInt(e.target.value) || 90)}
                min="1"
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                Jobs inactive for {autoArchiveDays} days will be suggested for archiving
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              padding: "10px 20px",
              background: "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveAutoArchiveSettings}
            style={{
              padding: "10px 20px",
              background: "#4f8ef7",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}