import React, { useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import logo from "../logo.svg.png"; 
import "../styles/home.css"; 
import { Link } from "react-router-dom";

const Home = ({ user, session }) => {
  useEffect(() => {
    // Add session or user logic here if needed
  }, [user, session]);

  return (
    <>
      <section className="home-hero d-flex align-items-center text-white text-center">
        <Container>
          <div className="d-flex flex-column align-items-center justify-content-center">
            <div className="mb-4">
              <img
                src={logo}
                alt="Metamorphosis logo"
                className="hero-logo mb-3"
              />
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 800,
                  fontSize: '4rem',
                  color: '#000',
                  }}
              >
              Metamorphosis
              </h1>
            </div>

            <h2 className="lead mb-4">
              Welcome! Let’s start your profile.
            </h2>

            <div>
              <Button 
                as={Link}
                to="/login"
                variant="success"
                size="lg"
                className="me-3"
              >
                Get Started
              </Button>
              
              <Button variant="outline-light" size="lg" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="features-section py-5 text-center text-white">
        <Container fluid>
          <h2 className="fw-bold mb-5">
            <i className="bi bi-lightning-charge-fill fs-2 me-2 text-gradient"></i>
            Powerful Tools for Every Step
          </h2>

          <Row className="justify-content-center flex-wrap g-4">
            <Col xs="auto">
              <Card className="feature-card p-4">
                <Card.Body>
                  <i className="bi bi-briefcase-fill fs-1 text-success mb-3"></i>
                  <Card.Title>Track Applications</Card.Title>
                  <Card.Text>
                    Keep tabs on every role you apply for — all in one place.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs="auto">
              <Card className="feature-card p-4">
                <Card.Body>
                  <i className="bi bi-bar-chart-fill fs-1 text-success mb-3"></i>
                  <Card.Title>Visual Analytics</Card.Title>
                  <Card.Text>
                    Gain insights into your job search performance and success rates.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs="auto">
              <Card className="feature-card p-4">
                <Card.Body>
                  <i className="bi bi-gear-wide-connected fs-1 text-success mb-3"></i>
                  <Card.Title>Automation Support</Card.Title>
                  <Card.Text>
                    Leverage automation tools to simplify repetitive job tasks.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col xs="auto">
              <Card className="feature-card p-4">
                <Card.Body>
                  <i className="bi bi-lightbulb-fill fs-1 text-success mb-3"></i>
                  <Card.Title>Smart Insights</Card.Title>
                  <Card.Text>
                    Get actionable recommendations to improve your job search strategy.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;

