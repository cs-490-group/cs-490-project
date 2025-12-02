import React, { useState, useEffect } from 'react';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';
import { useParams } from 'react-router-dom';

function InterviewPreparation() {
  const [interview, setInterview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskFormData, setTaskFormData] = useState({ 
    title: '', 
    description: '', 
    category: 'practice', 
    priority: 'medium' 
  });
  const [timeUntil, setTimeUntil] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { scheduleId } = useParams();

  // Load interview + tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[InterviewPrep] Loading interview:', scheduleId);
        
        // Fetch interview schedule
        const interviewRes = await InterviewScheduleAPI.getSchedule(scheduleId);
        console.log('[InterviewPrep] Full API Response:', interviewRes);
        console.log('[InterviewPrep] Response Data:', interviewRes.data);
        
        // Handle both response formats: {interview: {...}} or direct {...}
        const interviewData = interviewRes.data?.interview || interviewRes.data;
        console.log('[InterviewPrep] Extracted Interview Data:', interviewData);
        
        if (!interviewData) {
          throw new Error('No interview data received from API');
        }
        
        // Log specific fields to debug
        console.log('[InterviewPrep] scenario_name:', interviewData.scenario_name);
        console.log('[InterviewPrep] company_name:', interviewData.company_name);
        console.log('[InterviewPrep] interview_datetime:', interviewData.interview_datetime);
        
        setInterview(interviewData);

        // Get preparation tasks - try multiple sources
        let prepTasks = interviewData?.preparation_tasks || [];
        console.log('[InterviewPrep] Tasks from interview data:', prepTasks.length);
        
        // If no tasks in the main response, try the separate endpoint
        if (prepTasks.length === 0) {
          console.log('[InterviewPrep] No tasks in interview data, fetching separately...');
          const tasksRes = await InterviewScheduleAPI.getPreparationTasks(scheduleId);
          console.log('[InterviewPrep] Tasks API Response:', tasksRes.data);
          prepTasks = tasksRes.data?.tasks || tasksRes.data?.preparation_tasks || [];
        }

        // Generate tasks if none exist
        if (prepTasks.length === 0) {
          console.log('[InterviewPrep] No tasks found, generating...');
          await InterviewScheduleAPI.generateTasks(scheduleId);
          const genRes = await InterviewScheduleAPI.getPreparationTasks(scheduleId);
          prepTasks = genRes.data?.tasks || genRes.data?.preparation_tasks || [];
          console.log('[InterviewPrep] Generated tasks:', prepTasks.length);
        }

        console.log('[InterviewPrep] Final tasks count:', prepTasks.length);
        setTasks(prepTasks);
        setLoading(false);
      } catch (error) {
        console.error("[InterviewPrep] Error loading data:", error);
        console.error("[InterviewPrep] Error details:", error.response?.data);
        
        // Use mock data as fallback
        console.log("[InterviewPrep] Using fallback mock data");
        const mockInterview = {
          uuid: scheduleId,
          scenario_name: 'Senior Software Engineer',
          company_name: 'TechCorp',
          interview_datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          location_type: 'video',
          video_link: 'https://zoom.us/j/123456789',
          video_platform: 'zoom',
          interviewer_name: 'Jane Smith',
          interviewer_title: 'Engineering Manager',
          interviewer_email: 'jane.smith@techcorp.com',
          notes: 'Focus on system design and leadership experience',
          preparation_completion_percentage: 45
        };

        const mockTasks = [
          {
            task_id: '1',
            title: 'Research TechCorp',
            description: 'Study company mission, values, recent news',
            category: 'research',
            priority: 'high',
            is_completed: true
          },
          {
            task_id: '2',
            title: 'Practice behavioral questions',
            description: 'Prepare STAR-method responses',
            category: 'practice',
            priority: 'high',
            is_completed: false
          },
          {
            task_id: '3',
            title: 'Test video setup',
            description: 'Test camera, microphone, and internet',
            category: 'logistics',
            priority: 'high',
            is_completed: false
          }
        ];

        setInterview(mockInterview);
        setTasks(mockTasks);
        setLoading(false);
      }
    };

    loadData();
  }, [scheduleId]);

  // Calculate time until interview
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
  
  const handleTaskToggle = async (taskId) => {
    try {
      // Call API to toggle task completion
      await InterviewScheduleAPI.toggleTaskCompletion(scheduleId, taskId);
      
      // Update local state after successful API call
      const updatedTasks = tasks.map(task => 
        task.task_id === taskId 
          ? { ...task, is_completed: !task.is_completed }
          : task
      );
      setTasks(updatedTasks);
      
      const completed = updatedTasks.filter(t => t.is_completed).length;
      const percentage = Math.round((completed / updatedTasks.length) * 100);
      setInterview({ ...interview, preparation_completion_percentage: percentage });
    } catch (error) {
      console.error('[InterviewPrep] Error toggling task:', error);
      alert('Failed to update task. Please try again.');
    }
  };
  
  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority
    });
    setShowAddTask(true);
  };
  
  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(t => t.task_id !== taskId);
      setTasks(updatedTasks);
      
      const completed = updatedTasks.filter(t => t.is_completed).length;
      const percentage = updatedTasks.length > 0 
        ? Math.round((completed / updatedTasks.length) * 100)
        : 0;
      setInterview({ ...interview, preparation_completion_percentage: percentage });
    }
  };
  
  const handleSaveTask = () => {
    if (!taskFormData.title) {
      alert('Please enter a task title');
      return;
    }
    
    if (editingTask) {
      // Update existing task
      setTasks(tasks.map(task =>
        task.task_id === editingTask.task_id
          ? { ...task, ...taskFormData }
          : task
      ));
    } else {
      // Add new task
      const newTask = {
        task_id: Date.now().toString(),
        ...taskFormData,
        is_completed: false
      };
      setTasks([...tasks, newTask]);
    }
    
    // Reset form
    setTaskFormData({ title: '', description: '', category: 'practice', priority: 'medium' });
    setEditingTask(null);
    setShowAddTask(false);
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
  
  const filteredTasks = filterCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === filterCategory);
  
  const completedCount = tasks.filter(t => t.is_completed).length;
  const categories = ['all', 'research', 'practice', 'logistics', 'materials', 'follow-up'];
  
  const getCategoryIcon = (category) => {
    const icons = {
      research: '🔍',
      practice: '💪',
      logistics: '📋',
      materials: '📄',
      'follow-up': '📧',
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
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Schedule ID: {scheduleId}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '2rem', color: 'white', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>
              {interview.scenario_name || interview.job_title || 'Interview'}
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
            onClick={() => {
              setShowAddTask(!showAddTask);
              setEditingTask(null);
              setTaskFormData({ title: '', description: '', category: 'practice', priority: 'medium' });
            }}
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
        
        {/* Add/Edit Task Form */}
        {showAddTask && (
          <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>{editingTask ? 'Edit Task' : 'Add New Task'}</h4>
            <input
              type="text"
              placeholder="Task title"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
            <textarea
              placeholder="Description"
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              rows="2"
              style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={taskFormData.category}
                onChange={(e) => setTaskFormData({ ...taskFormData, category: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="research">Research</option>
                <option value="practice">Practice</option>
                <option value="logistics">Logistics</option>
                <option value="materials">Materials</option>
                <option value="follow-up">Follow-up</option>
              </select>
              <select
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <button 
                onClick={handleSaveTask} 
                style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {editingTask ? 'Update' : 'Add'}
              </button>
              <button 
                onClick={() => {
                  setShowAddTask(false);
                  setEditingTask(null);
                  setTaskFormData({ title: '', description: '', category: 'practice', priority: 'medium' });
                }} 
                style={{ padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Tasks */}
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>No preparation tasks yet</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Click "Add Task" to create your first task
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p>No tasks in this category</p>
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditTask(task)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.task_id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Interview Details Modal */}
      {showDetailsModal && (
        <div 
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
                  <strong>{interview.scenario_name || interview.job_title || 'Interview'}</strong> at {interview.company_name || 'Company'}
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
                <p style={{ margin: 0, textTransform: 'capitalize' }}>
                  {interview.location_type === 'video' ? '🎥' : interview.location_type === 'phone' ? '📞' : '🏢'} {interview.location_type}
                </p>
                {interview.location_type === 'video' && interview.video_link && (
                  <a 
                    href={interview.video_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#667eea', textDecoration: 'none', marginTop: '8px', display: 'block' }}
                  >
                    {interview.video_link}
                  </a>
                )}
                {interview.location_type === 'phone' && interview.phone_number && (
                  <p style={{ margin: '8px 0 0 0' }}>📞 {interview.phone_number}</p>
                )}
                {interview.location_type === 'in-person' && interview.location_details && (
                  <p style={{ margin: '8px 0 0 0' }}>{interview.location_details}</p>
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