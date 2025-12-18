import React from 'react';
import './RecentChanges.css';

const RecentChanges = ({ changes }) => {
  // Handle empty or null data
  if (!changes || changes.length === 0) {
    return (
      <div className="recent-changes-wrapper">
        <div className="text-center text-muted py-4">
          <p className="mb-0">No recent changes</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        padding: '10px',
        backgroundColor: '#E5E9EC',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid #D1D5DB',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 transparent',
      }}
      className="chart-scrollbar"
    >
      {changes.map((change, index) => (
        <div key={index}>
          <div className="recent-change-item">
            <div className="change-date">
              {change[0]}
            </div>
            <div className="change-description">
              {change[1]}
            </div>
          </div>
          {/* Add horizontal line after each item except the last one */}
          {index < changes.length - 1 && <hr className="change-divider" />}
        </div>
      ))}
    </div>
  );
};

export default RecentChanges;