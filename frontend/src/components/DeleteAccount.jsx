import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfilesApi from '../api/profiles';
import AuthApi from '../api/authentication';
import { useFlash } from '../context/flashContext';




const DeleteAccount = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [password, setPassword] = useState('');
  const { flash, showFlash } = useFlash();

  const handleDeleteClick = () => {
    setShowWarning(true);
  };

  const handleCancel = () => {
    setShowWarning(false);
    setPassword('');
  };

  const handleSubmit = async () => {
    if (password.trim()) {
      try {
        console.log({ password: password })
        const response = await ProfilesApi.deleteAllData({ password: password });
        
        
        // If we get here, it was successful (200)
        if (response.status === 200) {
          // Delete successful, now logout          
          localStorage.removeItem("uuid");
          localStorage.removeItem("teamId");
          localStorage.removeItem("session");
          navigate("/");
        }
      } catch (error) {
        // Handle different error codes
        if (error.response) {
          if (error.response.status === 401) {
            // Wrong password
            setPassword('');
            showFlash("Invalid password. Please try again.", "error");
          } else if (error.response.status === 500) {
            // Server error
            setPassword('');
            showFlash("Server error occurred. Please try again later.", "error");
          } else {
            // Other error
            setPassword('');
            showFlash("An unexpected error occurred. Please try again.", "error");
          }
        } else {
          // Network error or no response
          setPassword('');
          showFlash("Unable to connect to server. Please check your connection.", "error");
        }
        console.error("Delete failed:", error);
      }
    }
  };

  if (!showWarning) {
    return (
      <div style={{
        backgroundColor: '#F9FAFC',
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #D1D5DB',
        maxWidth: '400px',
        margin: '20px auto',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={handleDeleteClick}
          style={{
            backgroundColor: '#E53935',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#00A67A'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#E53935'}
        >
          Delete Account
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#F9FAFC',
      padding: '18px',
      borderRadius: '12px',
      border: '1px solid #E53935',
      maxWidth: '400px',
      margin: '20px auto',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#E5E9EC',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #D1D5DB',
        marginBottom: '12px',
        boxSizing: 'border-box'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#E53935',
          marginBottom: '6px',
          textAlign: 'center'
        }}>
          ⚠️ Warning: Account Deletion
        </h3>
        
        <p style={{
          fontSize: '12px',
          color: '#0A0F1A',
          marginBottom: '4px',
          lineHeight: '1.3',
          margin: 0
        }}>
          This action will <strong>permanently delete your account</strong> and all associated data.
        </p>
        
        <p style={{
          fontSize: '12px',
          color: '#0A0F1A',
          lineHeight: '1.3',
          margin: '2px 0 0 0'
        }}>
          <strong>This cannot be undone.</strong> All information will be removed immediately.
        </p>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: '600',
          color: '#0A0F1A',
          marginBottom: '4px'
        }}>
          Enter your password to confirm:
        </label>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            fontSize: '12px',
            boxSizing: 'border-box',
            color: '#0A0F1A',
            backgroundColor: '#FFFFFF'
          }}
          aria-label="Enter your password to confirm account deletion"
        />
      </div>

      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleCancel}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#4A4A4A',
            border: '1px solid #D1D5DB',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            flex: '1',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#E5E9EC'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
        >
          Cancel
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={!password.trim()}
          style={{
            backgroundColor: password.trim() ? '#E53935' : '#D1D5DB',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: password.trim() ? 'pointer' : 'not-allowed',
            flex: '1',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => {
            if (password.trim()) {
              e.target.style.backgroundColor = '#00A67A';
            }
          }}
          onMouseOut={(e) => {
            if (password.trim()) {
              e.target.style.backgroundColor = '#E53935';
            }
          }}
        >
          Confirm Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAccount;