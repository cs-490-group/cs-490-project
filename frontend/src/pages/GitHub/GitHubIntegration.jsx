import React, { useState, useEffect } from 'react';
import { 
  FaGithub, 
  FaSync,
  FaCheck,
  FaTimes,
  FaExclamationCircle
} from 'react-icons/fa';
import githubAPI from '../../api/githubAPI';
import RepositoryCard from './RepositoryCard';
import GitHubStats from './GitHubStats';
import ContributionActivity from './ContributionActivity';
import './GitHubIntegration.css';

const GitHubIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [githubUser, setGithubUser] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [featuredRepos, setFeaturedRepos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, featured, non-featured
  const [languageFilter, setLanguageFilter] = useState('all');
  const [error, setError] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('github_connected') === 'true') {
        // OAuth callback - keep loading until data is fetched
        setError(null);
        await checkConnectionStatus();
        // Clean URL after successful check
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('github_error') === 'true') {
        setError('Failed to connect GitHub. Please try again.');
        setLoading(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Normal page load
        checkConnectionStatus();
      }
    };

    handleOAuthCallback();
  }, []);

  // Fetch repositories when connected
  useEffect(() => {
    if (isConnected) {
      console.log("CONNECTED")
      const fetchInitialData = async () => {
        
        await fetchRepositories();
        await fetchFeaturedRepositories();
        await fetchStats();
        // Set loading to false after all data is loaded (for both initial and OAuth scenarios)
        setLoading(false);
      };
      fetchInitialData();
    }
  }, [isConnected]);

  const checkConnectionStatus = async () => {
    console.log("CHECKING")
    try {
      console.log("STARTING")
      const response = await githubAPI.checkAuthStatus();
      console.log("IN HERE")
      if (response.data.authenticated) {
        console.log("VALIDATED")
        setIsConnected(true);
        setGithubUser({
          username: response.data.username,
          avatarUrl: response.data.avatar_url,
          profileUrl: response.data.profile_url
        });
      } else {
        // Not connected - safe to stop loading
        console.log("NOT")
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking GitHub status:', err);
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    try {
      const response = await githubAPI.getConnectUrl();
      
      // Redirect to GitHub OAuth
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError('Failed to initiate GitHub connection');
      console.error(err);
    }
  };

  const disconnectGitHub = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub? This will remove all repository data.')) {
      return;
    }

    try {
      await githubAPI.disconnect();
      
      setIsConnected(false);
      setGithubUser(null);
      setRepositories([]);
      setFeaturedRepos([]);
      setStats(null);
      setError(null);
    } catch (err) {
      setError('Failed to disconnect GitHub');
      console.error(err);
    }
  };

  const fetchRepositories = async (refresh = false) => {
    if (refresh) setSyncing(true);
    
    try {
      const response = await githubAPI.getRepositories({
        includeForks: false,
        includeArchived: false,
        refresh: refresh
      });
      
      setRepositories(response.data.repositories || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch repositories');
      console.error(err);
    } finally {
      if (refresh) setSyncing(false);
    }
  };

  const fetchFeaturedRepositories = async () => {
    try {
      const response = await githubAPI.getFeaturedRepositories();
      setFeaturedRepos(response.data.repositories || []);
    } catch (err) {
      console.error('Error fetching featured repos:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await githubAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const toggleFeatured = async (repoId, currentStatus) => {
    try {
      await githubAPI.toggleFeatured(repoId, !currentStatus);

      // Update local state
      setRepositories(repos => 
        repos.map(repo => 
          repo.repo_id === repoId 
            ? { ...repo, is_featured: !currentStatus }
            : repo
        )
      );

      // Refresh featured list
      fetchFeaturedRepositories();
    } catch (err) {
      setError('Failed to update featured status');
      console.error(err);
    }
  };

  const handleSync = () => {
    fetchRepositories(true);
    fetchStats();
  };

  // Get unique languages for filter
  const languages = ['all', ...new Set(
    repositories
      .map(repo => repo.language)
      .filter(Boolean)
  )].sort();

  // Filter repositories
  const filteredRepos = repositories.filter(repo => {
    const matchesFeatureFilter = 
      filter === 'all' ||
      (filter === 'featured' && repo.is_featured) ||
      (filter === 'non-featured' && !repo.is_featured);
    
    const matchesLanguageFilter = 
      languageFilter === 'all' || 
      repo.language === languageFilter;

    return matchesFeatureFilter && matchesLanguageFilter;
  });

  if (loading) {
    return (
      <div className="github-integration">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="github-integration">
        <div className="connect-section">
          <FaGithub className="github-icon-large" />
          <h2>Connect Your GitHub</h2>
          <p>
            Import your repositories and showcase your projects on your profile.
            Connect your GitHub account to get started.
          </p>
          
          <div className="feature-list">
            <div className="feature-item">
              <FaCheck className="check-icon" />
              <span>Import public repositories</span>
            </div>
            <div className="feature-item">
              <FaCheck className="check-icon" />
              <span>Display repository stats (stars, forks, languages)</span>
            </div>
            <div className="feature-item">
              <FaCheck className="check-icon" />
              <span>Select featured projects for your profile</span>
            </div>
            <div className="feature-item">
              <FaCheck className="check-icon" />
              <span>Track contribution activity</span>
            </div>
            <div className="feature-item">
              <FaCheck className="check-icon" />
              <span>Link repositories to your skills</span>
            </div>
          </div>

          <button className="connect-button" onClick={connectGitHub}>
            <FaGithub /> Connect GitHub
          </button>

          {error && (
            <div className="error-message">
              <FaExclamationCircle /> {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="github-integration">
      {/* Header */}
      <div className="github-header">
        <div className="github-user-info">
          {githubUser?.avatarUrl && (
            <img 
              src={githubUser.avatarUrl} 
              alt={githubUser.username}
              className="github-avatar"
            />
          )}
          <div>
            <h2>
              <FaGithub /> GitHub Repositories
            </h2>
            <p className="github-username">
              Connected as <a href={githubUser?.profileUrl} target="_blank" rel="noopener noreferrer">
                @{githubUser?.username}
              </a>
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="sync-button"
            onClick={handleSync}
            disabled={syncing}
          >
            <FaSync className={syncing ? 'spinning' : ''} />
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <button 
            className="disconnect-button"
            onClick={disconnectGitHub}
          >
            <FaTimes /> Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FaExclamationCircle /> {error}
        </div>
      )}

      {/* Stats Dashboard */}
      {stats && <GitHubStats stats={stats} />}

      {/* Contribution Activity */}
      <ContributionActivity />

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Show:</label>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All Repositories ({repositories.length})
            </button>
            <button 
              className={filter === 'featured' ? 'active' : ''}
              onClick={() => setFilter('featured')}
            >
              Featured ({featuredRepos.length})
            </button>
            <button 
              className={filter === 'non-featured' ? 'active' : ''}
              onClick={() => setFilter('non-featured')}
            >
              Not Featured
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Language:</label>
          <select 
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="language-filter"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Repository Grid */}
      <div className="repositories-grid">
        {filteredRepos.length === 0 ? (
          <div className="no-repos">
            <p>No repositories found matching your filters.</p>
          </div>
        ) : (
          filteredRepos.map(repo => (
            <RepositoryCard
              key={repo.repo_id}
              repository={repo}
              onToggleFeatured={toggleFeatured}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GitHubIntegration;