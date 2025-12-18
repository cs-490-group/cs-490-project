import React, { useEffect } from 'react';

const CareerTimeline = ({ employmentData, title = "Career Timeline" }) => {
  // Process employment data into timeline format
  const processEmploymentData = (employment) => {
    if (!employment || employment.length === 0) {
      return null;
    }

    // Convert employment array to timeline format
    // Each entry should be: company name or title as key, [start_date, end_date] as value
    const timelineData = {};
    
    employment.forEach(job => {
      // Use company name if available, otherwise use title
      const displayName = job.company || job.title || 'Unknown Position';
      const startDate = job.start_date || null;
      const endDate = job.end_date || 'Present';
      
      if (startDate) {
        // Create a unique key in case of duplicate companies
        let key = displayName;
        let counter = 1;
        while (timelineData[key]) {
          key = `${displayName} (${counter})`;
          counter++;
        }
        
        timelineData[key] = [startDate, endDate];
      }
    });

    return Object.keys(timelineData).length > 0 ? timelineData : null;
  };

  const timelineData = processEmploymentData(employmentData);

  // Add CSS styles for custom scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .timeline-scrollbar::-webkit-scrollbar {
        width: 12px;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 6px;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-thumb {
        background: #9ca3af;
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #6b7280;
        background-clip: content-box;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-button {
        display: block;
        height: 12px;
        background: #9ca3af;
        border-radius: 6px;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-button:hover {
        background: #6b7280;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-button:single-button:vertical:decrement {
        background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath d='M4 2L1 5h6z' fill='%23ffffff'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
      }
      
      .timeline-scrollbar::-webkit-scrollbar-button:single-button:vertical:increment {
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

  // Function to parse date strings and calculate duration
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === "Present" || dateStr === "Current" || dateStr === "") {
      return new Date();
    }
    // Handle different date formats
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        return new Date(year, month);
      }
    }
    return new Date(dateStr);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "Present" || dateStr === "Current" || dateStr === "") {
      return "Present";
    }
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const calculateDuration = (startDate, endDate) => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffInMonths / 12);
      const months = diffInMonths % 12;
      if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
      } else {
        return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
      }
    }
  };

  // Function to check if a job ended recently (within last 185 days)
  const isRecentJob = (endDate) => {
    if (!endDate || endDate === "Present" || endDate === "Current" || endDate === "") {
      return false; // Current jobs are not "recent past" jobs
    }
    
    const end = parseDate(endDate);
    const now = new Date();
    const daysDifference = Math.floor((now - end) / (1000 * 60 * 60 * 24));
    
    return daysDifference <= 185;
  };

  // Check if data is empty
  if (!timelineData || Object.keys(timelineData).length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        padding: '10px',
        backgroundColor: '#E5E9EC',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid #D1D5DB',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px 0'
      }}>
        <p style={{ 
          margin: 0, 
          color: '#4A4A4A',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          No Employment History Available - Add your work experience to see your career timeline!
        </p>
      </div>
    );
  }

  // Convert to array and sort by start date (most recent first)
  const sortedEntries = Object.entries(timelineData).sort(([, [startA]], [, [startB]]) => {
    return parseDate(startB) - parseDate(startA);
  });

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        padding: '10px',
        backgroundColor: '#E5E9EC',
        borderRadius: '6px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        border: '1px solid #D1D5DB',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#9ca3af transparent',
        margin: '20px 0'
      }}
      className="timeline-scrollbar"
    >
      {/* Timeline Title */}
      <h3 style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#0A0F1A',
        marginBottom: '16px',
        marginTop: '0',
        textAlign: 'center',
        borderBottom: '1px solid #D1D5DB',
        paddingBottom: '8px',
        flexShrink: 0,
      }}>
        {title}
      </h3>

      {/* Timeline Container */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        paddingRight: '2px',
        position: 'relative',
      }}>
        {/* Timeline Line */}
        <div style={{
          position: 'absolute',
          left: '24px',
          top: '20px',
          bottom: '20px',
          width: '2px',
          backgroundColor: '#D1D5DB',
          zIndex: 1,
        }} />

        {/* Timeline Items */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingLeft: '0',
          position: 'relative',
          zIndex: 2,
        }}>
          {sortedEntries.map(([company, [startDate, endDate]], index) => {
            const isPresent = !endDate || endDate === "Present" || endDate === "Current" || endDate === "";
            const isRecent = isRecentJob(endDate);
            const duration = calculateDuration(startDate, endDate);

            return (
              <div key={`${company}-${index}`} style={{
                display: 'flex',
                alignItems: 'flex-start',
                position: 'relative',
                paddingLeft: '50px',
                flexShrink: 0,
              }}>
                {/* Timeline Dot */}
                <div style={{
                  position: 'absolute',
                  left: '15px',
                  top: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: isPresent ? '#00A67A' : // Teal for current job
                                   isRecent ? '#003366' : // Navy for recent past job (within 185 days)
                                   '#6366F1', // Purple for older jobs
                  border: '3px solid #E5E9EC',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  zIndex: 3,
                }} />

                {/* Job Details */}
                <div style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                  {/* Company Name */}
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#0A0F1A',
                    margin: '0 0 6px 0',
                    lineHeight: '1.3',
                  }}>
                    {company}
                  </h4>

                  {/* Date Range */}
                  <div style={{
                    fontSize: '11px',
                    color: '#4A4A4A',
                    marginBottom: '4px',
                    fontWeight: '500',
                  }}>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </div>

                  {/* Duration */}
                  <div style={{
                    fontSize: '10px',
                    color: '#6B7280',
                    fontStyle: 'italic',
                  }}>
                    {duration}
                  </div>

                  {/* Current Job Indicator */}
                  {isPresent && (
                    <div style={{
                      marginTop: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      color: '#00A67A',
                      fontWeight: '600',
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#00A67A',
                      }} />
                      Current Position
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        paddingTop: '8px',
        borderTop: '1px solid #D1D5DB',
        fontSize: '10px',
        color: '#4A4A4A',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#00A67A', borderRadius: '50%' }} />
          <span>Current</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#003366', borderRadius: '50%' }} />
          <span>Recent (within 6 months)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#6366F1', borderRadius: '50%' }} />
          <span>Previous</span>
        </div>
      </div>
    </div>
  );
};

export default CareerTimeline;