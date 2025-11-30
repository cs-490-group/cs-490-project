import React, { useState, useEffect } from 'react';

function InterviewPreparation() {
  const [interview, setInterview] = useState({
    uuid: '123',
    company: 'TechCorp',
    position: 'Software Engineer',
    interview_datetime: '2025-12-15T14:00:00',
    location_type: 'video',
    video_link: 'https://zoom.us/j/example',
    interviewer_name: 'Jane Smith',
    interviewer_title: 'Engineering Manager',
    preparation_completion_percentage: 45
  });
  
  const [tasks, setTasks] = useState([
    { task_id: '1', title: 'Research TechCorp', description: 'Study company mission, values, recent news', category: 'research', is_completed: true, priority: 'high' },
    { task_id: '2', title: 'Understand role requirements', description: 'Review job description thoroughly', category: 'research', is_completed: true, priority: 'high' },
    { task_id: '3', title: 'Practice behavioral questions', description: 'Prepare STAR-method responses', category: 'practice', is_completed: false, priority: 'high' },
    { task_id: '4', title: 'Prepare questions for interviewer', description: 'Have 5-10 thoughtful questions ready', category: 'practice', is_completed: false, priority: 'high' },
    { task_id: '5', title: 'Test video setup', description: 'Check camera, microphone, and connection', category: 'logistics', is_completed: false, priority: 'high' },
    { task_id: '6', title: 'Prepare interview environment', description: 'Choose quiet location with professional background', category: 'logistics', is_completed: false, priority: 'medium' },
    { task_id: '7', title: 'Review technical concepts', description: 'Brush up on relevant technologies', category: 'practice', is_completed: false, priority: 'medium' },
    { task_id: '8', title: 'Research Jane Smith', description: 'Look up interviewer on LinkedIn', category: 'research', is_completed: false, priority: 'medium' }
  ]);
  
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'practice', priority: 'medium' });
  const [timeUntil, setTimeUntil] = useState('');
  
  useEffect(() => {
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
      } else {
        setTimeUntil(`${minutes}m`);
      }
    };
    
    calculateTimeUntil();
    const interval = setInterval(calculateTimeUntil, 60000);
    return () => clearInterval(interval);
  }, [interview.interview_datetime]);
  
  const handleTaskToggle = (taskId) => {
    setTasks(tasks.map(task => 
      task.task_id === taskId 
        ? { ...task, is_completed: !task.is_completed }
        : task
    ));
    
    // Update completion percentage
    const completedCount = tasks.filter(t => t.task_id === taskId ? !t.is_completed : t.is_completed).length;
    const percentage = Math.round((completedCount / tasks.length) * 100);
    setInterview({ ...interview, preparation_completion_percentage: percentage });
  };
  
  const handleAddTask = () => {
    if (!newTask.title) return;
    
    const task = {
      task_id: String(Date.now()),
      ...newTask,
      is_completed: false
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', description: '', category: 'practice', priority: 'medium' });
    setShowAddTask(false);
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
  
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Section */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '2rem', color: 'white', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{interview.position}</h1>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>{interview.company}</p>
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
            <span style={{ fontWeight: 'bold' }}>{interview.preparation_completion_percentage}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${interview.preparation_completion_percentage}%`, 
              background: 'white',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {completedCount} of {tasks.length} tasks completed
          </div>
        </div>
        
        {/* Quick Links */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          {interview.location_type === 'video' && (
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
            onClick={() => alert('Opening interview details...')}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
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
      </div>
      
      {/* Generate Tasks Button */}
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <p>No preparation tasks yet</p>
          <button
            onClick={() => alert('Generating tasks...')}
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
      )}
    </div>
  );
}

export default InterviewPreparation;