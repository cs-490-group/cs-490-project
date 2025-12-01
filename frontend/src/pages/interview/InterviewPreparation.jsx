import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';
import { useFlash } from '../../context/flashContext';

function InterviewPreparation() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { showFlash } = useFlash();
  
  const [interview, setInterview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    category: 'practice', 
    priority: 'medium' 
  });
  const [timeUntil, setTimeUntil] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  useEffect(() => {
    if (scheduleId) {
      loadInterview();
    }
  }, [scheduleId]);
  
  useEffect(() => {
    if (interview?.interview_datetime) {
      const calculateTimeUntil = () => {
        const now = new Date();
        const interviewDate = new Date(interview.interview_datetime);
        const diff = interviewDate - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTimeUntil(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeUntil(`${hours}h ${minutes}m`);
        } else if (diff > 0) {
          setTimeUntil(`${minutes}m`);
        } else {
          setTimeUntil('Interview time passed');
        }
      };
      
      calculateTimeUntil();
      const interval = setInterval(calculateTimeUntil, 60000);
      return () => clearInterval(interval);
    }
  }, [interview?.interview_datetime]);
  
  const loadInterview = async () => {
    setLoading(true);
    try {
      // Load interview details
      const interviewResponse = await InterviewScheduleAPI.getSchedule(scheduleId);
      setInterview(interviewResponse.data.interview);
      
      // Load preparation tasks
      const tasksResponse = await InterviewScheduleAPI.getPreparationTasks(scheduleId);
      setTasks(tasksResponse.data.tasks || []);
    } catch (error) {
      console.error('Failed to load interview:', error);
      showFlash('Failed to load interview details', 'error');
      navigate('/interview/calendar');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTaskToggle = async (taskId) => {
    try {
      const response = await InterviewScheduleAPI.toggleTaskCompletion(scheduleId, taskId);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, is_completed: !task.is_completed }
          : task
      ));
      
      // Update completion percentage
      if (interview) {
        setInterview({
          ...interview,
          preparation_completion_percentage: response.data.completion_percentage
        });
      }
      
      showFlash('Task updated', 'success');
    } catch (error) {
      console.error('Failed to toggle task:', error);
      showFlash('Failed to update task', 'error');
    }
  };
  
  const handleAddTask = async () => {
    if (!newTask.title) {
      showFlash('Please enter a task title', 'error');
      return;
    }
    
    try {
      await InterviewScheduleAPI.addTask(scheduleId, {
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority
      });
      
      // Reload tasks
      await loadInterview();
      
      // Reset form
      setNewTask({ title: '', description: '', category: 'practice', priority: 'medium' });
      setShowAddTask(false);
      
      showFlash('Task added successfully', 'success');
    } catch (error) {
      console.error('Failed to add task:', error);
      showFlash('Failed to add task', 'error');
    }
  };
  
  const handleGenerateTasks = async () => {
    try {
      await InterviewScheduleAPI.generateTasks(scheduleId);
      await loadInterview();
      showFlash('Tasks generated successfully', 'success');
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      showFlash('Failed to generate tasks', 'error');
    }
  };
  
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      })
    };
  };
  
  const getLocationIcon = (locationType) => {
    switch(locationType) {
      case 'video': return '🎥';
      case 'phone': return '📞';
      case 'in-person': return '🏢';
      default: return '📍';
    }
  };
  
  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filterCategory);
  
  const completedCount = tasks.filter(t => t.is_completed).length;
  const categories = ['all', 'research', 'practice', 'logistics', 'materials'];
  
  const getCategoryIcon = (category) => {
    const icons = {
      research: '🔍',
      practice: '💪',
      logistics: '📋',
      materials: '📄',
      all: '📌'
    };
    return icons[category] || '📌';
  };
  
  const getPriorityColor = (priority) => {
    return priority === 'high' ? '#dc3545' : priority === 'medium' ? '#ffc107' : '#28a745';
  };
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <p>Loading interview preparation...</p>
      </div>
    );
  }
  
  if (!interview) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Interview not found</p>
          <button 
            onClick={() => navigate('/interview/calendar')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/interview/calendar')}
        style={{
          padding: '0.5rem 1rem',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        ← Back to Calendar
      </button>
      
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '2rem', color: 'white', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>
              {interview.scenario_name || 'Interview'}
            </h1>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
              {interview.company_name || 'Company'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>⏰</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{timeUntil}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>until interview</div>
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Preparation Progress</span>
            <span style={{ fontWeight: 'bold' }}>
              {interview.preparation_completion_percentage || 0}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${interview.preparation_completion_percentage || 0}%`, 
              background: 'white',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {completedCount} of {tasks.length} tasks completed
          </div>
        </div>
        
        {/* Quick Links */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {interview.location_type === 'video' && interview.video_link && (
            <a 
              href={interview.video_link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'rgba(255,255,255,0.9)', 
                color: '#667eea', 
                borderRadius: '6px', 
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🎥 Join Meeting
            </a>
          )}
          {interview.location_type === 'phone' && interview.phone_number && (
            <a 
              href={`tel:${interview.phone_number}`}
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'rgba(255,255,255,0.9)', 
                color: '#667eea', 
                borderRadius: '6px', 
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              📞 {interview.phone_number}
            </a>
          )}
          {interview.location_type === 'in-person' && interview.location_details && (
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(interview.location_details)}`, '_blank')}
              style={{ 
                padding: '0.5rem 1rem', 
                background: 'rgba(255,255,255,0.9)', 
                color: '#667eea', 
                borderRadius: '6px', 
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9rem'
              }}
            >
              🏢 View Location
            </button>
          )}
          <button
            onClick={() => setShowDetailsModal(true)}
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            📝 View Details
          </button>
        </div>
      </div>
      
      {/* Category Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                border: filterCategory === cat ? '2px solid #667eea' : '1px solid #ddd',
                borderRadius: '20px',
                background: filterCategory === cat ? '#f0f4ff' : 'white',
                color: filterCategory === cat ? '#667eea' : '#666',
                cursor: 'pointer',
                fontWeight: filterCategory === cat ? '600' : '400',
                fontSize: '0.9rem',
                textTransform: 'capitalize'
              }}
            >
              {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tasks List */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Preparation Tasks</h2>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + Add Task
          </button>
        </div>
        
        {/* Add Task Form */}
        {showAddTask && (
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows="2"
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="research">Research</option>
                <option value="practice">Practice</option>
                <option value="logistics">Logistics</option>
                <option value="materials">Materials</option>
              </select>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <button onClick={handleAddTask} style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Add
              </button>
              <button onClick={() => setShowAddTask(false)} style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Tasks */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>No preparation tasks yet</p>
            <button
              onClick={handleGenerateTasks}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '1rem'
              }}
            >
              Generate Preparation Tasks
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.map(task => (
              <div
                key={task.task_id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: task.is_completed ? '#f8f9fa' : 'white',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'start',
                  opacity: task.is_completed ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => handleTaskToggle(task.task_id)}
                  style={{ marginTop: '0.25rem', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                    <h4 style={{ 
                      margin: 0, 
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                      fontSize: '1rem'
                    }}>
                      {task.title}
                    </h4>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '12px', 
                      background: getPriorityColor(task.priority),
                      color: 'white',
                      fontWeight: '500'
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    {task.description}
                  </p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                    {getCategoryIcon(task.category)} {task.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Interview Details Modal */}
      {showDetailsModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowDetailsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Interview Details</h2>
              <button 
                onClick={() => setShowDetailsModal(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Position & Company</h4>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  <strong>{interview.scenario_name || 'Interview'}</strong> at {interview.company_name || 'Company'}
                </p>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Date & Time</h4>
                <p style={{ margin: 0 }}>
                  {formatDateTime(interview.interview_datetime).date}
                  <br />
                  {formatDateTime(interview.interview_datetime).time}
                </p>
              </div>
              
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Location</h4>
                <p style={{ margin: 0 }}>
                  {getLocationIcon(interview.location_type)} {interview.location_type}
                </p>
                {interview.video_link && (
                  <a 
                    href={interview.video_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#667eea', textDecoration: 'none' }}
                  >
                    {interview.video_link}
                  </a>
                )}
                {interview.location_details && (
                  <p style={{ margin: '8px 0 0 0' }}>{interview.location_details}</p>
                )}
                {interview.phone_number && (
                  <p style={{ margin: '8px 0 0 0' }}>📞 {interview.phone_number}</p>
                )}
              </div>
              
              {interview.interviewer_name && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Interviewer</h4>
                  <p style={{ margin: 0 }}>
                    {interview.interviewer_name}
                    {interview.interviewer_title && ` - ${interview.interviewer_title}`}
                  </p>
                  {interview.interviewer_email && (
                    <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                      📧 {interview.interviewer_email}
                    </p>
                  )}
                </div>
              )}
              
              {interview.notes && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>Notes</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{interview.notes}</p>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '10px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPreparation;