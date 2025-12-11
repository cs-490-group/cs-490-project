import React, { useEffect } from 'react';

const BarChart = ({ data, title = "Bar Chart" }) => {
  // Default data if none provided
  const defaultData = {
    "JavaScript": 85,
    "Python": 70,
    "React": 90,
    "Node.js": 65,
    "CSS": 80,
    "HTML": 95,
    "TypeScript": 60,
    "Docker": 45,
    "Docker2": 45,
    "Docker3": 45,
    "Docker4": 15,
    "Docker5": 45
  };

  const chartData = data || defaultData;

  // Add CSS styles for custom scrollbar (same as CategoryCard)
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .chart-scrollbar::-webkit-scrollbar {
        width: 12px;
      }
      
      .chart-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 6px;
      }
      
      .chart-scrollbar::-webkit-scrollbar-thumb {
        background: #9ca3af;
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      
      .chart-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
        background-clip: content-box;
      }
      
      .chart-scrollbar::-webkit-scrollbar-button {
        display: block;
        height: 12px;
        background: #9ca3af;
        border-radius: 6px;
      }
      
      .chart-scrollbar::-webkit-scrollbar-button:hover {
        background: #6b7280;
      }
      
      .chart-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
        background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M4 2L1 5h6z' fill='%23ffffff'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
      }
      
      .chart-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
        background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M4 6L1 3h6z' fill='%23ffffff'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check if data is empty
  if (!chartData || Object.keys(chartData).length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        padding: '10px',
        backgroundColor: '#E5E9EC',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid #D1D5DB',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#4A4A4A',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          No Chart Data Available
        </p>
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...Object.values(chartData));
  
  // Convert object to array of entries and sort by value (descending)
  const sortedEntries = Object.entries(chartData).sort(([,a], [,b]) => b - a);

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
      {/* Chart Title */}
      <h3 style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#0A0F1A',
        marginBottom: '12px',
        marginTop: '0',
        textAlign: 'center',
        borderBottom: '1px solid #D1D5DB',
        paddingBottom: '8px'
      }}>
        {title}
      </h3>

      {/* Bars Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {sortedEntries.map(([label, value], index) => {
          // Calculate percentage width based on max value
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={label} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {/* Label and Value */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#0A0F1A',
                  fontWeight: '500',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '60%'
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#4A4A4A',
                  fontWeight: '400'
                }}>
                  {value}
                </span>
              </div>

              {/* Bar Background and Fill */}
              <div style={{
                width: '100%',
                height: '16px',
                backgroundColor: '#D1D5DB',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  backgroundColor: index === 0 ? '#00A67A' : // Teal for highest value
                                   index === 1 ? '#003366' : // Navy for second highest
                                   '#6366F1', // Purple for others
                  borderRadius: '8px',
                  transition: 'width 0.3s ease',
                  minWidth: percentage > 0 ? '4px' : '0' // Minimum visible width for small values
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        paddingTop: '8px',
        borderTop: '1px solid #D1D5DB',
        fontSize: '10px',
        color: '#4A4A4A'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#00A67A', borderRadius: '2px' }} />
          <span>Highest</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#003366', borderRadius: '2px' }} />
          <span>Second</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#6366F1', borderRadius: '2px' }} />
          <span>Others</span>
        </div>
      </div>
    </div>
  );
};

export default BarChart;