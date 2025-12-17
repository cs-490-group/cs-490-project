import React, { useEffect, useState } from "react";
import posthog from "posthog-js";

export function Banner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    
    const consentChoice = localStorage.getItem("metamorphosis_consent");
    
    
    if (!consentChoice) {
      console.log("No consent choice found, showing banner");
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("metamorphosis_consent", "accepted"); 
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("metamorphosis_consent", "declined"); 
    posthog.opt_out_capturing();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '20px', right: '20px',
      background: '#064e3b', color: 'white', padding: '20px',
      borderRadius: '8px', zIndex: 9999, display: 'flex', 
      justifyContent: 'space-between', alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      <p style={{ margin: 0 }}>We use cookies to improve your experience. Allow tracking?</p>
      <div>
        <button onClick={handleAccept} style={{ marginRight: '10px', padding: '8px 16px', background: '#10b981', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Accept</button>
        <button onClick={handleDecline} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>Decline</button>
      </div>
    </div>
  );
}