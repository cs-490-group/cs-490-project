import React, { useState } from 'react';
import './CompanyResearchReport.css';
import { FiChevronDown, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { InterviewScheduleAPI } from '../../api/interviewSchedule';

const CompanyResearchReport = ({ interview, onRegenerateComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    leadership: true,
    competition: true,
    news: true,
    talkingPoints: true,
    questions: true
  });
  const [error, setError] = useState(null);

  const research = interview?.research;

  if (!research) {
    return (
      <div className="research-empty">
        <p>No research data available. Generate company research to get started.</p>
      </div>
    );
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await InterviewScheduleAPI.regenerateCompanyResearch(interview._id);
      onRegenerateComplete && onRegenerateComplete(response.data.research);
    } catch (err) {
      setError('Failed to regenerate research. Please try again.');
      console.error('Error regenerating research:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(research, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${interview.company_name}_research.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export - requires external library like jsPDF
    alert('PDF export coming soon. You can download as JSON or copy the content.');
  };

  const handleExportWord = () => {
    // Placeholder for Word export - requires external library like docx
    alert('Word export coming soon. You can download as JSON or copy the content.');
  };

  const companyProfile = research.company_profile || {};
  const leadershipTeam = research.leadership_team || [];
  const recentNews = research.recent_news || [];
  const funding = research.funding || [];
  const competition = research.competition || [];
  const talkingPoints = research.talking_points || [];
  const intelligentQuestions = research.intelligent_questions || {};

  return (
    <div className="company-research-report">
      <div className="research-header">
        <div className="research-header-content">
          <h2>Company Research Report</h2>
          <p className="research-subtitle">
            {interview.company_name} - {interview.scenario_name}
          </p>
        </div>
        <div className="research-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRegenerate}
            disabled={isLoading}
            title="Regenerate research data"
          >
            <FiRefreshCw /> {isLoading ? 'Generating...' : 'Regenerate'}
          </button>
          <div className="dropdown-menu">
            <button className="btn btn-secondary btn-sm dropdown-toggle">
              <FiDownload /> Export
            </button>
            <div className="dropdown-content">
              <button onClick={handleExportJSON}>Export as JSON</button>
              <button onClick={handleExportPDF}>Export as PDF</button>
              <button onClick={handleExportWord}>Export as Word</button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Company Overview */}
      <section className={`research-section ${expandedSections.overview ? 'expanded' : 'collapsed'}`}>
        <div
          className="section-header"
          onClick={() => toggleSection('overview')}
        >
          <h3>Company Overview</h3>
          <FiChevronDown className={expandedSections.overview ? 'chevron-open' : ''} />
        </div>
        {expandedSections.overview && (
          <div className="section-content">
            {companyProfile.description && (
              <div className="overview-item">
                <p className="overview-text">{companyProfile.description}</p>
              </div>
            )}
            <div className="overview-grid">
              {companyProfile.industry && (
                <div className="overview-card">
                  <span className="label">Industry</span>
                  <p>{companyProfile.industry}</p>
                </div>
              )}
              {companyProfile.size && (
                <div className="overview-card">
                  <span className="label">Company Size</span>
                  <p>{companyProfile.size}</p>
                </div>
              )}
              {companyProfile.location && (
                <div className="overview-card">
                  <span className="label">Headquarters</span>
                  <p>{companyProfile.location}</p>
                </div>
              )}
              {research.mission_and_values && (
                <div className="overview-card">
                  <span className="label">Mission & Values</span>
                  <p>{research.mission_and_values.substring(0, 100)}...</p>
                </div>
              )}
            </div>
            {companyProfile.key_services && (
              <div className="overview-item">
                <h4>Key Services/Products</h4>
                <p>{companyProfile.key_services}</p>
              </div>
            )}
            {research.history && (
              <div className="overview-item">
                <h4>Company History</h4>
                <p>{research.history}</p>
              </div>
            )}
            {research.mission_and_values && (
              <div className="overview-item">
                <h4>Mission & Values</h4>
                <p>{research.mission_and_values}</p>
              </div>
            )}
            {research.market_position && (
              <div className="overview-item">
                <h4>Market Position</h4>
                <p>{research.market_position}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Leadership Team */}
      {leadershipTeam && leadershipTeam.length > 0 && (
        <section className={`research-section ${expandedSections.leadership ? 'expanded' : 'collapsed'}`}>
          <div
            className="section-header"
            onClick={() => toggleSection('leadership')}
          >
            <h3>Leadership Team</h3>
            <FiChevronDown className={expandedSections.leadership ? 'chevron-open' : ''} />
          </div>
          {expandedSections.leadership && (
            <div className="section-content">
              <div className="leadership-list">
                {leadershipTeam.map((leader, index) => (
                  <div key={index} className="leadership-card">
                    <h4>{leader.name}</h4>
                    <p className="title">{leader.title}</p>
                    {leader.background && <p className="background">{leader.background}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Competitive Landscape */}
      {(competition.length > 0 || research.market_position) && (
        <section className={`research-section ${expandedSections.competition ? 'expanded' : 'collapsed'}`}>
          <div
            className="section-header"
            onClick={() => toggleSection('competition')}
          >
            <h3>Competitive Landscape</h3>
            <FiChevronDown className={expandedSections.competition ? 'chevron-open' : ''} />
          </div>
          {expandedSections.competition && (
            <div className="section-content">
              {competition.length > 0 && (
                <div className="competition-list">
                  <h4>Key Competitors</h4>
                  {competition.map((competitor, index) => (
                    <div key={index} className="competitor-item">
                      {competitor.name && <h5>{competitor.name}</h5>}
                      {competitor.description && <p>{competitor.description}</p>}
                      {competitor.market_position && (
                        <p className="market-position">
                          <strong>Market Position:</strong> {competitor.market_position}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Recent News & Updates */}
      {(recentNews.length > 0 || funding.length > 0) && (
        <section className={`research-section ${expandedSections.news ? 'expanded' : 'collapsed'}`}>
          <div
            className="section-header"
            onClick={() => toggleSection('news')}
          >
            <h3>Recent News & Strategy</h3>
            <FiChevronDown className={expandedSections.news ? 'chevron-open' : ''} />
          </div>
          {expandedSections.news && (
            <div className="section-content">
              {recentNews.length > 0 && (
                <div className="news-list">
                  <h4>Recent Announcements</h4>
                  {recentNews.map((news, index) => (
                    <div key={index} className="news-item">
                      <div className="news-header">
                        <h5>{news.title}</h5>
                        {news.date && <span className="date">{news.date}</span>}
                      </div>
                      {news.description && <p>{news.description}</p>}
                      {news.category && (
                        <span className={`category category-${news.category}`}>
                          {news.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {funding.length > 0 && (
                <div className="funding-list">
                  <h4>Funding Information</h4>
                  {funding.map((round, index) => (
                    <div key={index} className="funding-item">
                      <div className="funding-header">
                        <h5>{round.round}</h5>
                        {round.amount_usd && (
                          <span className="amount">${round.amount_usd.toLocaleString()}</span>
                        )}
                      </div>
                      {round.date && <p className="date">Date: {round.date}</p>}
                      {round.investors && round.investors.length > 0 && (
                        <p className="investors">
                          <strong>Investors:</strong> {round.investors.join(', ')}
                        </p>
                      )}
                      {round.total_raised_usd && (
                        <p className="total">
                          <strong>Total Raised:</strong> ${round.total_raised_usd.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Talking Points */}
      {talkingPoints.length > 0 && (
        <section className={`research-section ${expandedSections.talkingPoints ? 'expanded' : 'collapsed'}`}>
          <div
            className="section-header"
            onClick={() => toggleSection('talkingPoints')}
          >
            <h3>Talking Points</h3>
            <FiChevronDown className={expandedSections.talkingPoints ? 'chevron-open' : ''} />
          </div>
          {expandedSections.talkingPoints && (
            <div className="section-content">
              <div className="talking-points-list">
                {talkingPoints.map((point, index) => (
                  <div key={index} className="talking-point-item">
                    <span className="point-number">{index + 1}</span>
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Intelligent Questions */}
      {intelligentQuestions && Object.keys(intelligentQuestions).length > 0 && (
        <section className={`research-section ${expandedSections.questions ? 'expanded' : 'collapsed'}`}>
          <div
            className="section-header"
            onClick={() => toggleSection('questions')}
          >
            <h3>Intelligent Questions to Ask</h3>
            <FiChevronDown className={expandedSections.questions ? 'chevron-open' : ''} />
          </div>
          {expandedSections.questions && (
            <div className="section-content">
              <div className="questions-categories">
                {intelligentQuestions.role_alignment && intelligentQuestions.role_alignment.length > 0 && (
                  <div className="question-category">
                    <h4>Role Alignment</h4>
                    <ul>
                      {intelligentQuestions.role_alignment.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intelligentQuestions.strategy && intelligentQuestions.strategy.length > 0 && (
                  <div className="question-category">
                    <h4>Strategy</h4>
                    <ul>
                      {intelligentQuestions.strategy.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intelligentQuestions.team_culture && intelligentQuestions.team_culture.length > 0 && (
                  <div className="question-category">
                    <h4>Team & Culture</h4>
                    <ul>
                      {intelligentQuestions.team_culture.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {intelligentQuestions.projects && intelligentQuestions.projects.length > 0 && (
                  <div className="question-category">
                    <h4>Projects & Innovation</h4>
                    <ul>
                      {intelligentQuestions.projects.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <div className="research-footer">
        <p className="research-generated">
          Research generated: {research.generated_at ? new Date(research.generated_at).toLocaleString() : 'Unknown'}
        </p>
      </div>
    </div>
  );
};

export default CompanyResearchReport;
