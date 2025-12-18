import React from 'react';

const AccessibleProgressBar = ({ now, variant = 'primary', label, 'aria-label': ariaLabel, style, className }) => {
  return (
    <div className={`progress ${className || ''}`} style={{ height: '1rem', marginBottom: '1rem', ...style }}>
      <div 
        className={`progress-bar bg-${variant}`} 
        role="progressbar" 
        style={{ width: `${now}%` }} 
        aria-valuenow={now} 
        aria-valuemin="0" 
        aria-valuemax="100"
        aria-label={ariaLabel}
      >
        {label}
      </div>
    </div>
  );
};

export default AccessibleProgressBar;