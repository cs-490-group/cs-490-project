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
      
      // Open OAuth URL in new window
      const authUrl = response.data.auth_url;
      window.open(authUrl, 'Gmail Authorization', 'width=600,height=700');
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        const status = await EmailsAPI.checkAuthStatus();
        if (status.data.authenticated) {
          clearInterval(pollInterval);
          setAuthStatus(status.data);
          setConnecting(false);
          alert("✅ Gmail connected successfully!");
        }
      }, 2000);
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setConnecting(false);
      }, 120000);
      
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      alert("Failed to connect Gmail. Please try again.");
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
      alert("Failed to disconnect Gmail. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "20px",
        textAlign: "center",
        color: "#666"
      }}>
        <div style={{ fontSize: "24px", marginBottom: "12px" }}>⏳</div>
        <p>Checking Gmail connection...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "white",
      border: "1px solid #e0e0e0",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "600px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "20px"
      }}>
        <div style={{
          width: "60px",
          height: "60px",
          background: authStatus?.authenticated 
            ? "linear-gradient(135deg, #4caf50 0%, #81c784 100%)"
            : "linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px"
        }}>
          📧
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 4px 0", color: "#333", fontSize: "18px" }}>
            Gmail Integration
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
            {authStatus?.authenticated 
              ? `Connected as ${authStatus.email || 'your account'}`
              : "Connect your Gmail to link emails to job applications"
            }
          </p>
        </div>
      </div>

      {authStatus?.authenticated ? (
        <div>
          <div style={{
            background: "#e8f5e9",
            border: "1px solid #c8e6c9",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px"
            }}>
              <span style={{ fontSize: "24px" }}>✅</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#2e7d32" }}>
                  Gmail Connected
                </div>
                <div style={{ fontSize: "12px", color: "#555" }}>
                  You can now search and link emails to your job applications
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: "#f9f9f9",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#333" }}>
              ✨ Features Available:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "13px",
              color: "#555",
              lineHeight: "1.8"
            }}>
              <li>Search emails by company name</li>
              <li>Search by job title and keywords</li>
              <li>Automatic status detection (Interview, Offer, etc.)</li>
              <li>View full email content</li>
              <li>Add notes to linked emails</li>
              <li>Track all communication in one place</li>
            </ul>
          </div>

          <button
            onClick={handleDisconnect}
            style={{
              padding: "10px 20px",
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              color: "#666",
              width: "100%"
            }}
          >
            🔌 Disconnect Gmail
          </button>
        </div>
      ) : (
        <div>
          <div style={{
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px"
          }}>
            <div style={{
              fontSize: "13px",
              color: "#856404",
              lineHeight: "1.6"
            }}>
              <strong>🔒 Privacy Notice:</strong> We only request read-only access to your Gmail.
              We cannot send emails or modify your mailbox. You can revoke access at any time.
            </div>
          </div>

          <div style={{
            background: "#f9f9f9",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#333" }}>
              📋 What you can do:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "13px",
              color: "#555",
              lineHeight: "1.8"
            }}>
              <li>Link relevant emails to each job application</li>
              <li>Keep track of recruiter communications</li>
              <li>Get automatic suggestions for interview/offer emails</li>
              <li>Never lose important application correspondence</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: "14px 24px",
              background: connecting 
                ? "#ccc"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: connecting ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "15px",
              width: "100%",
              boxShadow: connecting ? "none" : "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
          >
            {connecting ? "⏳ Connecting..." : "🔗 Connect Gmail Account"}
          </button>

          {connecting && (
            <p style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "#666",
              textAlign: "center"
            }}>
              Complete the authorization in the popup window...
            </p>
          )}
        </div>
      )}

      <div style={{
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: "1px solid #e0e0e0",
        fontSize: "11px",
        color: "#999",
        textAlign: "center"
      }}>
        <p style={{ margin: 0 }}>
          🔒 Your email data is only accessed when you explicitly search and link emails.
          We comply with Gmail API Terms of Service and user privacy policies.
        </p>
      </div>
    </div>
  );
}