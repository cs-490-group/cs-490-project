import React from 'react';
import { 
  FaStar, 
  FaCodeBranch, 
  FaBook,
  FaCode,
  FaTrophy
} from 'react-icons/fa';
import './GitHubStats.css';

const GitHubStats = ({ stats }) => {
  const topLanguages = Object.entries(stats.languages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const totalLanguageRepos = Object.values(stats.languages || {})
    .reduce((sum, count) => sum + count, 0);

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
      CSS: '#563d7c'
    };
    return colors[language] || '#858585';
  };

  return (
    <div className="github-stats">
      <h3 className="stats-title">
        <FaTrophy /> Overview
      </h3>
      
      <div className="stats-grid">
        {/* Total Repositories */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0f6fc' }}>
            <FaBook style={{ color: '#0969da' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_repos}</div>
            <div className="stat-label">Total Repositories</div>
          </div>
        </div>

        {/* Featured Repositories */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff8dc' }}>
            <FaStar style={{ color: '#bf8700' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.featured_repos}</div>
            <div className="stat-label">Featured Projects</div>
          </div>
        </div>

        {/* Total Stars */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fff4e6' }}>
            <FaStar style={{ color: '#fb8500' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_stars}</div>
            <div className="stat-label">Total Stars</div>
          </div>
        </div>

        {/* Total Forks */}
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>
            <FaCodeBranch style={{ color: '#16a34a' }} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total_forks}</div>
            <div className="stat-label">Total Forks</div>
          </div>
        </div>
      </div>

      {/* Language Distribution */}
      {topLanguages.length > 0 && (
        <div className="languages-section">
          <h4>
            <FaCode /> Top Languages
          </h4>
          <div className="languages-chart">
            {topLanguages.map(([language, count]) => {
              const percentage = (count / totalLanguageRepos) * 100;
              return (
                <div key={language} className="language-bar-container">
                  <div className="language-info">
                    <span className="language-name">
                      <span 
                        className="language-dot"
                        style={{ backgroundColor: getLanguageColor(language) }}
                      />
                      {language}
                    </span>
                    <span className="language-count">
                      {count} {count === 1 ? 'repo' : 'repos'}
                    </span>
                  </div>
                  <div className="language-bar-track">
                    <div 
                      className="language-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getLanguageColor(language)
                      }}
                    />
                  </div>
                  <span className="language-percentage">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Synced */}
      {stats.last_synced && (
        <div className="last-synced">
          <small>
            Last synced: {new Date(stats.last_synced).toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};

export default GitHubStats;