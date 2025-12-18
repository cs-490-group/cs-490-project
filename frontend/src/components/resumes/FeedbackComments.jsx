import React from 'react';
import '../../styles/resumes.css';

/**
 * FeedbackComments Component
 * Display and manage comments/feedback on resume
 * Related to UC-054
 */
export default function FeedbackComments({ feedback, onResolveComment, onDeleteComment }) {
  return (
    <div className="feedback-comments">
      {feedback && feedback.length > 0 ? (
        <div className="comments-list">
          {feedback.map((comment) => (
            <div
              key={comment.id}
              className={`comment-card ${comment.resolved ? 'resolved' : ''}`}
            >
              <div className="comment-header">
                <div className="reviewer-info">
                  <h6>{comment.reviewer}</h6>
                  <small>{comment.email}</small>
                </div>
                <div className="comment-date">
                  {new Date(comment.date).toLocaleDateString()}
                </div>
              </div>

              <div className="comment-body">
                <p>{comment.comment}</p>
              </div>

              <div className="comment-footer">
                {comment.resolved && (
                  <span className="badge bg-success">✓ Resolved</span>
                )}
              </div>

              <div className="comment-actions">
                <button
                  onClick={() => onResolveComment(comment.id)}
                  className={`btn btn-sm ${
                    comment.resolved ? 'btn-outline-success' : 'btn-outline-primary'
                  }`}
                >
                  {comment.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="btn btn-sm btn-outline-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">No feedback yet</div>
      )}
    </div>
  );
}
