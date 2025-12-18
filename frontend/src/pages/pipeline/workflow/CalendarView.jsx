import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Clock, ChevronLeft, ChevronRight, XCircle, CheckCircle } from 'lucide-react';
import ApplicationWorkflowAPI from '../../../api/applicationWorkflow';
import { 
  getCurrentAndNextYearHolidays, 
  checkSchedulingWarnings 
} from '../../../utils/holidayGenerator';

export default function CalendarView({ schedules, jobs, packages, userEmail, onReschedule }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    // Load dynamic holidays for current and next year
    const dynamicHolidays = getCurrentAndNextYearHolidays();
    setHolidays(dynamicHolidays);
    
    checkForHolidayWarnings();
  }, [schedules]);

  const checkForHolidayWarnings = () => {
    const newWarnings = [];

    schedules.forEach(schedule => {
      const warnings = checkSchedulingWarnings(schedule.scheduled_time);
      
      if (warnings.length > 0) {
        const job = jobs.find(j => j._id === schedule.job_id);
        warnings.forEach(warning => {
          newWarnings.push({
            scheduleId: schedule._id,
            type: warning.type,
            severity: warning.severity,
            jobTitle: job?.title || 'Unknown',
            message: warning.message,
            suggestion: warning.suggestion,
            icon: warning.icon
          });
        });
      }
    });

    setWarnings(newWarnings);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_time);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const getHolidayForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const year = date.getFullYear();
    return holidays[year]?.find(h => h.date === dateStr);
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getWarningsForSchedule = (scheduleId) => {
    return warnings.filter(w => w.scheduleId === scheduleId);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!window.confirm('Cancel this scheduled application?')) return;
    
    try {
      await ApplicationWorkflowAPI.cancelSchedule(scheduleId);
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Failed to cancel schedule');
    }
  };

  const handleMarkComplete = async (scheduleId) => {
    if (!window.confirm('Mark this application as completed? This will update the job status to submitted.')) return;
    
    try {
      await ApplicationWorkflowAPI.markScheduleComplete(scheduleId);
      alert('Schedule marked as completed!');
      window.location.reload();
    } catch (error) {
      console.error('Error marking schedule complete:', error);
      alert(error.response?.data?.detail || 'Failed to mark schedule complete');
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 d-flex align-items-center gap-2">
          <Calendar size={24} />
          Application Calendar
        </h3>
        
        <div className="d-flex align-items-center gap-3">
          <button onClick={previousMonth} className="btn btn-outline-secondary">
            <ChevronLeft size={18} />
          </button>
          
          <span className="fw-bold fs-5" style={{ minWidth: '200px', textAlign: 'center' }}>
            {monthName}
          </span>
          
          <button onClick={nextMonth} className="btn btn-outline-secondary">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 d-flex flex-wrap gap-3 small">
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '20px', height: '20px', backgroundColor: '#cfe2ff', border: '2px solid #0d6efd', borderRadius: '4px' }}></div>
          <span>Scheduled</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '20px', height: '20px', backgroundColor: '#d1e7dd', border: '2px solid #198754', borderRadius: '4px' }}></div>
          <span>Completed</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '20px', height: '20px', backgroundColor: '#f8d7da', border: '2px solid #dc3545', borderRadius: '4px' }}></div>
          <span>Holiday Warning</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: '20px', height: '20px', backgroundColor: '#fff3cd', border: '2px solid #ffc107', borderRadius: '4px' }}></div>
          <span>Weekend</span>
        </div>
      </div>

      {/* Warning Summary */}
      {warnings.length > 0 && (
        <div className="alert alert-danger d-flex gap-3 mb-4">
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div className="flex-grow-1">
            <h6 className="alert-heading mb-2">Scheduling Warnings</h6>
            <p className="mb-2">
              You have {warnings.length} application{warnings.length > 1 ? 's' : ''} scheduled on suboptimal days
            </p>
            {warnings.slice(0, 3).map((warning, idx) => (
              <div key={idx} className="small mb-1">
                {warning.icon} <strong>{warning.jobTitle}</strong>: {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="card shadow">
        <div className="card-body p-0" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '800px' }}>
            {/* Day Headers */}
            <div className="d-flex border-bottom bg-light">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div 
                  key={day} 
                  className="text-center py-3 fw-semibold border-end"
                  style={{ flex: '1 1 0', minWidth: '100px' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIdx) => (
              <div key={weekIdx} className="d-flex" style={{ minHeight: '140px' }}>
                {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
                  const daySchedules = getSchedulesForDate(day.date);
                  const holiday = getHolidayForDate(day.date);
                  const weekend = isWeekend(day.date);
                  const today = isToday(day.date);
                  
                  let bgColor = '';
                  let borderClass = 'border-end border-bottom';
                  
                  if (!day.isCurrentMonth) {
                    bgColor = 'bg-light bg-opacity-50';
                  } else if (holiday) {
                    bgColor = 'bg-success bg-opacity-10';
                  } else if (weekend) {
                    bgColor = 'bg-warning bg-opacity-10';
                  }
                  
                  if (today) {
                    borderClass += ' border-primary border-3';
                  }

                  return (
                    <div
                      key={dayIdx}
                      className={`${borderClass} ${bgColor} p-2`}
                      style={{ 
                        flex: '1 1 0',
                        minWidth: '100px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setSelectedDate(day.date)}
                      onMouseEnter={(e) => {
                        if (!bgColor) e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        if (!bgColor) e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      {/* Date Number */}
                      <div 
                        className={`fw-semibold mb-2 ${
                          !day.isCurrentMonth ? 'text-muted' : 
                          today ? 'text-primary fs-5' : 
                          'text-dark'
                        }`}
                      >
                        {day.date.getDate()}
                      </div>

                      {/* Holiday Badge */}
                      {holiday && (
                        <div className="mb-2">
                          <div 
                            className="badge bg-success text-wrap w-100 text-start py-1" 
                            style={{ fontSize: '0.7rem', lineHeight: '1.2' }}
                          >
                            🎉 {holiday.name}
                          </div>
                        </div>
                      )}

                      {/* Schedules */}
                      <div className="d-flex flex-column gap-1">
                        {daySchedules.slice(0, 2).map(schedule => {
                          const scheduleWarnings = getWarningsForSchedule(schedule._id);
                          const hasHighWarning = scheduleWarnings.some(w => w.severity === 'high');
                          const job = jobs.find(j => j._id === schedule.job_id);
                          const isCompleted = schedule.status === 'completed';
                          
                          return (
                            <div
                              key={schedule._id}
                              className={`small p-1 rounded text-truncate d-flex align-items-center gap-1 ${
                                isCompleted
                                  ? 'bg-success text-white'
                                  : hasHighWarning 
                                  ? 'bg-danger text-white'
                                  : 'bg-primary text-white'
                              }`}
                              style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                              title={`${job?.title} @ ${typeof job?.company === 'object' ? job?.company.name : job?.company}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(day.date);
                              }}
                            >
                              {isCompleted ? <CheckCircle size={10} /> : hasHighWarning ? <AlertTriangle size={10} /> : <Clock size={10} />}
                              <span className="text-truncate">{job?.title || 'Unknown'}</span>
                            </div>
                          );
                        })}
                        {daySchedules.length > 2 && (
                          <div className="small text-muted" style={{ fontSize: '0.65rem' }}>
                            +{daySchedules.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Details Panel */}
      {selectedDate && (
        <div className="card shadow mt-4">
          <div className="card-body">
            <h5 className="card-title mb-3">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h5>

            {getHolidayForDate(selectedDate) && (
              <div className="alert alert-success">
                <p className="fw-bold mb-1">
                  🎉 {getHolidayForDate(selectedDate).name}
                </p>
                <p className="small mb-0">
                  Federal offices and most businesses are closed. Applications sent on this day will likely be ignored.
                </p>
              </div>
            )}

            {isWeekend(selectedDate) && (
              <div className="alert alert-warning">
                <p className="fw-bold mb-1">⚠️ Weekend Day</p>
                <p className="small mb-0">
                  Applications sent on weekends typically get 60% lower response rates.
                </p>
              </div>
            )}

            {getSchedulesForDate(selectedDate).length === 0 ? (
              <p className="text-muted small">No scheduled applications for this day</p>
            ) : (
              <div className="row g-3">
                {getSchedulesForDate(selectedDate).map(schedule => {
                  const scheduleWarnings = getWarningsForSchedule(schedule._id);
                  const job = jobs.find(j => j._id === schedule.job_id);
                  const pkg = packages.find(p => p._id === schedule.package_id);
                  const company = typeof job?.company === 'object' ? job?.company.name : job?.company;
                  const isCompleted = schedule.status === 'completed';
                  
                  return (
                    <div key={schedule._id} className="col-12">
                      <div className={`card border-2 ${isCompleted ? 'border-success' : ''}`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="card-title mb-1">{job?.title || 'Unknown'}</h6>
                              <p className="small text-muted mb-1"><strong>{company}</strong></p>
                              <p className="small text-muted mb-0">📦 {pkg?.name || 'Unknown package'}</p>
                              <p className="small text-muted mb-0">
                                <Clock size={12} className="me-1" />
                                {new Date(schedule.scheduled_time).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <span className={`badge ${
                              schedule.status === 'scheduled' ? 'bg-primary' :
                              schedule.status === 'completed' ? 'bg-success' :
                              'bg-secondary'
                            }`}>
                              {schedule.status}
                            </span>
                          </div>

                          {scheduleWarnings.length > 0 && !isCompleted && (
                            <div className="mb-3">
                              {scheduleWarnings.map((warning, idx) => (
                                <div
                                  key={idx}
                                  className={`alert ${
                                    warning.severity === 'high' ? 'alert-danger' :
                                    warning.severity === 'medium' ? 'alert-warning' :
                                    'alert-info'
                                  } mb-2 py-2`}
                                >
                                  <p className="small fw-bold mb-1">{warning.icon} {warning.message}</p>
                                  <p className="small mb-0">💡 {warning.suggestion}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {isCompleted ? (
                            <div className="alert alert-success mb-0">
                              <CheckCircle size={16} className="me-2" />
                              <strong>Completed!</strong> This application was submitted.
                            </div>
                          ) : (
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={() => handleMarkComplete(schedule._id)}
                                title="Mark as completed (if you submitted manually)"
                              >
                                <CheckCircle size={14} className="me-1" />
                                Mark Complete
                              </button>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => onReschedule && onReschedule(schedule._id)}
                              >
                                Reschedule
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleCancelSchedule(schedule._id)}
                              >
                                <XCircle size={14} className="me-1" />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}