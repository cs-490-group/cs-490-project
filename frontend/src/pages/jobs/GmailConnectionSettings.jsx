import React, { useState, useEffect } from "react";
import EmailsAPI from "../../api/emails";

export default function GmailConnectionSettings() {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await EmailsAPI.checkAuthStatus();
      setAuthStatus(response.data);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setAuthStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      const response = await EmailsAPI.initiateConnection();
      const authUrl = response.data.auth_url;
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        authUrl,
        'Gmail Authorization',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );
      
      if (!popup) {
        alert("❌ Popup blocked! Please allow popups for this site.");
        setConnecting(false);
        return;
      }
      
      const pollInterval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            setConnecting(false);
            return;
          }
          
          const status = await EmailsAPI.checkAuthStatus();
          if (status.data.authenticated) {
            clearInterval(pollInterval);
            clearTimeout(timeout);
            setAuthStatus(status.data);
            setConnecting(false);
            popup.close();
            alert("✅ Gmail connected successfully!");
          }
        } catch (error) {
          console.error("Error polling auth status:", error);
        }
      }, 2000);
      
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setConnecting(false);
        if (!popup.closed) {
          popup.close();
        }
        alert("⏱️ Connection timed out. Please try again.");
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      alert("❌ Failed to connect Gmail. Please try again.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Gmail? You'll need to reconnect to link emails.")) {
      return;
    }

    try {
      await EmailsAPI.disconnect();
      setAuthStatus({ authenticated: false });
      alert("✅ Gmail disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      alert("❌ Failed to disconnect Gmail. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "16px",
        textAlign: "center",
        color: "#666",
        background: "#f9f9f9",
        borderRadius: "8px",
        border: "1px solid #e0e0e0"
      }}>
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>⏳</div>
        <p style={{ margin: 0, fontSize: "13px" }}>Checking connection...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "#f9f9f9",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "16px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          background: authStatus?.authenticated 
            ? "linear-gradient(135deg, #4caf50 0%, #81c784 100%)"
            : "linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          flexShrink: 0
        }}>
          📧
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: "0 0 2px 0", color: "#333", fontSize: "14px", fontWeight: "600" }}>
            Gmail Integration
          </h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#666", wordBreak: "break-word" }}>
            {authStatus?.authenticated 
              ? `Connected: ${authStatus.email || 'your account'}`
              : "Not connected"
            }
          </p>
        </div>
      </div>

      {authStatus?.authenticated ? (
        <div>
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #c8e6c9",
            borderRadius: "6px",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "12px",
            color: "#2e7d32"
          }}>
            ✅ <strong>Connected</strong> - You can search and link emails
          </div>

          <button
            onClick={handleDisconnect}
            style={{
              padding: "8px 14px",
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              color: "#666",
              width: "100%",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "#e0e0e0"}
            onMouseOut={(e) => e.target.style.background = "#f5f5f5"}
          >
            🔌 Disconnect Gmail
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "6px",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "11px",
            color: "#856404",
            lineHeight: "1.4"
          }}>
            <strong>🔒 Privacy:</strong> Read-only access only
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: "10px 16px",
              background: connecting 
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: connecting ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "13px",
              width: "100%",
              boxShadow: connecting ? "none" : "0 2px 8px rgba(102, 126, 234, 0.3)",
              transition: "all 0.2s"
            }}
          >
            {connecting ? "⏳ Connecting..." : "🔗 Connect Gmail"}
          </button>

          {connecting && (
            <p style={{
              marginTop: "8px",
              fontSize: "11px",
              color: "#666",
              textAlign: "center",
              margin: "8px 0 0 0"
            }}>
              Complete authorization in popup...
            </p>
          )}
        </div>
      )}
    </div>
  );
}