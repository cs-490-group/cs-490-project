import React from 'react';

function PreparationChecklist({ tasks, onTaskToggle, onAddTask, onDeleteTask }) {
  const categories = ['research', 'practice', 'logistics', 'materials'];
  
  const getCategoryIcon = (category) => {
    const icons = {
      research: '🔍',
      practice: '💪',
      logistics: '📋',
      materials: '📄'
    };
    return icons[category] || '📌';
  };
  
  const getPriorityColor = (priority) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority] || '#6c757d';
  };
  
  const completedCount = tasks.filter(t => t.is_completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  return (
    <div className="preparation-checklist">
      {/* Progress Summary */}
      <div className="checklist-header">
        <div className="progress-info">
          <h3>Preparation Progress</h3>
          <span className="progress-text">{completedCount} of {tasks.length} tasks completed</span>
        </div>
        <div className="progress-percentage">{completionPercentage}%</div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ 
            width: `${completionPercentage}%`,
            backgroundColor: completionPercentage >= 75 ? '#28a745' : completionPercentage >= 50 ? '#ffc107' : '#dc3545'
          }}
        />
      </div>
      
      {/* Tasks by Category */}
      {categories.map(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
        if (categoryTasks.length === 0) return null;
        
        return (
          <div key={category} className="category-section">
            <div className="category-header">
              <span className="category-icon">{getCategoryIcon(category)}</span>
              <span className="category-name">{category}</span>
              <span className="category-count">
                {categoryTasks.filter(t => t.is_completed).length}/{categoryTasks.length}
              </span>
            </div>
            
            <div className="tasks-list">
              {categoryTasks.map(task => (
                <div 
                  key={task.task_id} 
                  className={`task-item ${task.is_completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => onTaskToggle(task.task_id)}
                    className="task-checkbox"
                  />
                  
                  <div className="task-content">
                    <div className="task-header">
                      <span className="task-title">{task.title}</span>
                      <span 
                        className="task-priority"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="task-description">{task.description}</p>
                  </div>
                  
                  {onDeleteTask && (
                    <button
                      onClick={() => onDeleteTask(task.task_id)}
                      className="task-delete"
                      aria-label="Delete task"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Add Task Button */}
      {onAddTask && (
        <button onClick={onAddTask} className="add-task-button">
          + Add Custom Task
        </button>
      )}
      
      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="empty-checklist">
          <div className="empty-icon">📋</div>
          <p>No preparation tasks yet</p>
          {onAddTask && (
            <button onClick={onAddTask} className="btn-primary">
              Add Your First Task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PreparationChecklist;