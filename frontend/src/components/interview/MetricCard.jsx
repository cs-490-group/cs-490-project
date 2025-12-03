import React from 'react';

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  color = '#667eea',
  onClick 
}) {
  const getTrendIcon = (trend) => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };
  
  const getTrendColor = (trend) => {
    if (trend === 'up') return '#28a745';
    if (trend === 'down') return '#dc3545';
    return '#6c757d';
  };
  
  return (
    <div 
      className={`metric-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="metric-header">
        <div className="metric-title">{title}</div>
        {icon && (
          <div 
            className="metric-icon"
            style={{ color }}
          >
            {icon}
          </div>
        )}
      </div>
      
      <div 
        className="metric-value"
        style={{ color }}
      >
        {value}
      </div>
      
      {subtitle && (
        <div className="metric-subtitle">
          {subtitle}
        </div>
      )}
      
      {trend && (
        <div 
          className="metric-trend"
          style={{ color: getTrendColor(trend) }}
        >
          <span className="trend-icon">{getTrendIcon(trend)}</span>
          <span className="trend-text">
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
          {trendValue && (
            <span className="trend-value"> ({trendValue})</span>
          )}
        </div>
      )}
    </div>
  );
}

export default MetricCard;