import React, { useState } from 'react';
import { 
  FaStar, 
  FaCodeBranch, 
  FaExternalLinkAlt,
  FaCircle,
  FaClock,
  FaStickyNote,
  FaLink,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import githubAPI from '../../api/githubAPI';
import './RepositoryCard.css';

const RepositoryCard = ({ repository, onToggleFeatured }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(repository.notes || '');
  const [saving, setSaving] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num;
  };

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: '#f1e05a',
      Python: '#3572A5',
      Java: '#b07219',
      TypeScript: '#2b7489',
      'C++': '#f34b7d',
      C: '#555555',
      'C#': '#178600',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Rust: '#dea584',
      Scala: '#c22d40',
      Dart: '#00B4AB',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Shell: '#89e051',
      Vue: '#2c3e50',
      React: '#61dafb'
    };
    return colors[language] || '#858585';
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await githubAPI.updateNotes(repository.repo_id, notes);
      setShowNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const topLanguages = Object.entries(repository.languages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);

  return (
    <div className={`repository-card ${repository.is_featured ? 'featured' : ''}`}>
      {repository.is_featured && (
        <div className="featured-badge">
          <FaStar /> Featured
        </div>
      )}

      <div className="repo-header">
        <div className="repo-title">
          <h3>
            <a 
              href={repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="repo-link"
            >
              {repository.name}
              <FaExternalLinkAlt className="external-icon" />
            </a>
          </h3>
          {repository.is_fork && (
            <span className="fork-badge">Forked</span>
          )}
          {repository.is_archived && (
            <span className="archived-badge">Archived</span>
          )}
        </div>

        <button
          className={`feature-button ${repository.is_featured ? 'active' : ''}`}
          onClick={() => onToggleFeatured(repository.repo_id, repository.is_featured)}
          title={repository.is_featured ? 'Remove from featured' : 'Add to featured'}
        >
          <FaStar />
        </button>
      </div>

      {repository.description && (
        <p className="repo-description">{repository.description}</p>
      )}

      {repository.homepage && (
        <a 
          href={repository.homepage} 
          target="_blank" 
          rel="noopener noreferrer"
          className="repo-homepage"
        >
          <FaLink /> {repository.homepage}
        </a>
      )}

      {/* Stats */}
      <div className="repo-stats">
        {repository.language && (
          <div className="stat-item language">
            <FaCircle 
              style={{ color: getLanguageColor(repository.language) }}
            />
            <span>{repository.language}</span>
          </div>
        )}
        
        {repository.stargazers_count > 0 && (
          <div className="stat-item">
            <FaStar />
            <span>{formatNumber(repository.stargazers_count)}</span>
          </div>
        )}
        
        {repository.forks_count > 0 && (
          <div className="stat-item">
            <FaCodeBranch />
            <span>{formatNumber(repository.forks_count)}</span>
          </div>
        )}
        
        <div className="stat-item">
          <FaClock />
          <span>Updated {formatDate(repository.updated_at)}</span>
        </div>
      </div>

      {/* Topics */}
      {repository.topics && repository.topics.length > 0 && (
        <div className="repo-topics">
          {repository.topics.map(topic => (
            <span key={topic} className="topic-tag">
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Languages breakdown */}
      {topLanguages.length > 0 && (
        <div className="languages-breakdown">
          {topLanguages.map(lang => (
            <div 
              key={lang}
              className="language-tag"
              style={{ 
                borderColor: getLanguageColor(lang),
                color: getLanguageColor(lang)
              }}
            >
              {lang}
            </div>
          ))}
        </div>
      )}

      {/* Notes section */}
      <div className="repo-notes-section">
        <button 
          className="notes-toggle"
          onClick={() => setShowNotes(!showNotes)}
        >
          <FaStickyNote /> {notes ? 'Edit Notes' : 'Add Notes'}
        </button>

        {showNotes && (
          <div className="notes-editor">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this repository..."
              rows={3}
            />
            <div className="notes-actions">
              <button 
                className="save-notes"
                onClick={saveNotes}
                disabled={saving}
              >
                <FaCheck /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                className="cancel-notes"
                onClick={() => {
                  setNotes(repository.notes || '');
                  setShowNotes(false);
                }}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}

        {notes && !showNotes && (
          <div className="notes-preview">
            <FaStickyNote className="note-icon" />
            <p>{notes}</p>
          </div>
        )}
      </div>

      {/* Linked skills indicator */}
      {repository.linked_skills && repository.linked_skills.length > 0 && (
        <div className="linked-skills">
          <FaLink /> Linked to {repository.linked_skills.length} skill(s)
        </div>
      )}
    </div>
  );
};

export default RepositoryCard;