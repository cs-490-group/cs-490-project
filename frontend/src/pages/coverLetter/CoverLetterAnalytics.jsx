import React, { useState, useEffect } from 'react';
import CoverLetterAPI from '../../api/coverLetters';
import { Card, Row, Col, ProgressBar, Spinner, Badge } from 'react-bootstrap';
import { TrendingUp, Award, BarChart2, Zap } from 'lucide-react';

export default function CoverLetterAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await CoverLetterAPI.getPerformanceStats();
        setData(res.data || res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="text-center p-4"><Spinner animation="border" size="sm"/> Analyzing data...</div>;
  if (!data || !data.styles || data.styles.length === 0) {
    return (
      <div className="text-center p-5 bg-light rounded-4 border border-dashed">
        <BarChart2 className="text-muted mb-2" size={32}/>
        <h5>No Data Yet</h5>
        <p className="text-muted">Link your cover letters to jobs to see performance metrics.</p>
      </div>
    );
  }

  // Sort by Interview Rate descending
  const sortedStyles = [...data.styles].sort((a, b) => b.interview_rate - a.interview_rate);
  const topStyle = sortedStyles[0];

  return (
    <div className="fade-in">
      {/* INSIGHTS HEADER */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-primary bg-opacity-10 p-4 rounded-4 mb-4 border border-primary">
           <h5 className="text-primary fw-bold d-flex align-items-center gap-2">
             <Zap size={20}/> AI Insights
           </h5>
           <ul className="mb-0 ps-3">
             {data.insights.map((insight, idx) => (
               <li key={idx} className="text-dark mb-1">{insight}</li>
             ))}
           </ul>
        </div>
      )}

      <Row className="g-4">
        {/* CHART SECTION */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100 rounded-4">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">Template Performance (A/B Test)</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {sortedStyles.map((style) => (
                <div key={style.style} className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    {/* Fix 1: Capitalize style name */}
                    <span className="fw-bold text-dark text-capitalize">{style.style.replace(/_/g, ' ')}</span>
                    <span className="text-muted small">{style.total_sent} applications</span>
                  </div>
                  
                  {/* Interview Rate Bar */}
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small mb-1">
                        <span>Interview Rate</span>
                        <span className="fw-bold text-primary">{style.interview_rate}%</span>
                    </div>
                    <ProgressBar now={style.interview_rate} variant="primary" style={{height: '8px'}} aria-label={`Interview rate for ${style.style}`} />
                  </div>

                  {/* Response Rate Bar (Faded) */}
                  <div>
                    <div className="d-flex justify-content-between small mb-1">
                        <span className="text-muted">Any Response</span>
                        <span className="text-muted">{style.response_rate}%</span>
                    </div>
                    <ProgressBar now={style.response_rate} variant="info" style={{height: '4px', opacity: 0.5}} aria-label={`Response rate for ${style.style}`} />
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* WINNER CARD */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100 rounded-4 bg-success text-white" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
                <div className="bg-white bg-opacity-25 p-3 rounded-circle align-self-center mb-3">
                    <Award size={32} className="text-white"/>
                </div>
                <h6 className="text-white text-opacity-75 text-uppercase fw-bold mb-1">Top Performer</h6>
                
                {/* Fix 1: Capitalize style name */}
                <h2 className="fw-bold mb-2 display-6 text-capitalize">{topStyle.style.replace(/_/g, ' ')}</h2>
                
                <p className="text-white text-opacity-90 mb-4">
                    This style gets you the most interviews.
                </p>
                
                {/* Fix 2: Change text color to dark for visibility against white box */}
                <div className="bg-white rounded-3 p-3 text-dark shadow-sm">
                    <div className="display-5 fw-bold text-success">{topStyle.interview_rate}%</div>
                    <small className="text-muted fw-bold">Success Rate</small>
                </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}