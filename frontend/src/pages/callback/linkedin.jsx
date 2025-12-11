import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LinkedInCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Send message back to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'LINKEDIN_AUTH_SUCCESS',
        code: code,
        error: error || errorDescription,
      }, window.location.origin);
      
      // Close the popup
      window.close();
    } else {
      // Fallback: redirect to main app if not opened as popup
      if (error) {
        navigate('/login?error=' + encodeURIComponent(errorDescription || error));
      } else if (code) {
        // Store code temporarily and redirect to login
        sessionStorage.setItem('linkedin_code', code);
        navigate('/login');
      } else {
        navigate('/login?error=LinkedIn authentication failed');
      }
    }
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
