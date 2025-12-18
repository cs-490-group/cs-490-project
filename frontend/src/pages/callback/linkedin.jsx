import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LinkedInCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    const payload = {
      type: 'LINKEDIN_AUTH_SUCCESS',
      code: code,
      error: error || errorDescription,
      state: state,
    };

    try {
      const storageKey = `linkedin_oauth_result:${state || 'nostate'}`;
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
    }

    // Send message back to parent window
    if (window.opener) {
      try {
        window.opener.postMessage(payload, window.location.origin);
      } catch (e) {
      }
      
      // Close the popup
      window.close();
    } else {
      window.close();
    }

    setTimeout(() => {
      if (!window.closed) {
        const qs = new URLSearchParams();
        if (payload.state) {
          qs.set('linkedin_state', payload.state);
        }
        if (payload.error) {
          qs.set('error', payload.error);
        }
        const suffix = qs.toString();
        navigate('/login' + (suffix ? `?${suffix}` : ''));
      }
    }, 500);
  }, [navigate, location]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Processing LinkedIn authentication...</p>
      </div>
    </div>
  );
}

export default LinkedInCallback;
