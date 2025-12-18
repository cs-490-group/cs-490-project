// components/DashboardCard.jsx
import React from 'react';

const DashboardCard = ({ 
  title, 
  href = '#', 
  height, 
  flex,
  style = {}, 
  contentStyle = {},
  children 
}) => {
  return (
    <div
      style={{
        backgroundColor: '#F9FAFC',
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #D1D5DB',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        ...(height && { height }),
        ...(flex && { flex }),
        ...style,
      }}
    >
      <a 
        href={href}
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#003366',
          marginBottom: '12px',
          textAlign: 'center',
          textDecoration: 'none',
          display: 'block',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseOver={(e) => e.target.style.color = '#00A67A'}
        onMouseOut={(e) => e.target.style.color = '#003366'}
      >
        {title}
      </a>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;