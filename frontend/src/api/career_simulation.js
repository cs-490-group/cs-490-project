import api from './base';

class CareerSimulationAPI {
    // Create a new career simulation
    async createSimulation(simulationRequest) {
        const response = await api.post('/career-simulation/simulate', simulationRequest);
        return response.data;
    }

    // Get a specific simulation by ID
    async getSimulation(simulationId) {
        const response = await api.get(`/career-simulation/${simulationId}`);
        return response.data;
    }

    // Get all simulations for a specific offer
    async getSimulationsForOffer(offerId) {
        const response = await api.get(`/career-simulation/offer/${offerId}`);
        return response.data;
    }

    // Get all simulations for the authenticated user
    async getUserSimulations() {
        const response = await api.get('/career-simulation/me');
        return response.data;
    }

    // Delete a simulation
    async deleteSimulation(simulationId) {
        const response = await api.delete(`/career-simulation/${simulationId}`);
        return response.data;
    }

    // Get simulation statistics
    async getSimulationStatistics() {
        const response = await api.get('/career-simulation/statistics/me');
        return response.data;
    }

    // Helper method to create a simulation request
    createSimulationRequest(offerId, options = {}) {
        return {
            offer_id: offerId,
            simulation_years: options.simulationYears || 5,
            success_criteria: options.successCriteria || [
                {
                    criteria_type: 'salary',
                    weight: 0.4,
                    target_value: 150000,
                    importance: 'high',
                    description: 'Competitive salary growth'
                },
                {
                    criteria_type: 'work_life_balance',
                    weight: 0.3,
                    target_value: 8,
                    importance: 'high',
                    description: 'Good work-life balance'
                },
                {
                    criteria_type: 'learning_opportunities',
                    weight: 0.2,
                    target_value: 8,
                    importance: 'medium',
                    description: 'Continuous learning and growth'
                },
                {
                    criteria_type: 'impact',
                    weight: 0.1,
                    target_value: 7,
                    importance: 'medium',
                    description: 'Meaningful work and impact'
                }
            ],
            personal_growth_rate: options.personalGrowthRate || 0.5,
            risk_tolerance: options.riskTolerance || 0.5,
            job_change_frequency: options.jobChangeFrequency || 2.5,
            geographic_flexibility: options.geographicFlexibility !== false,
            industry_switch_willingness: options.industrySwitchWillingness || false,
            inflation_rate: options.inflationRate || 0.025,
            market_growth_rate: options.marketGrowthRate || 0.05,
            industry_trend_override: options.industryTrendOverride
        };
    }

    // Helper method to format simulation response for display
    formatSimulationForDisplay(simulation) {
        if (!simulation || !simulation.response) {
            return null;
        }

        const response = simulation.response;
        return {
            id: simulation.simulation_id,
            status: simulation.status,
            createdAt: simulation.created_at,
            completedAt: simulation.updated_at,
            computationTime: simulation.computation_time_seconds,
            
            // Career paths
            careerPaths: response.career_paths || [],
            optimalPath: response.optimal_path,
            pathRankings: response.path_rankings || [],
            
            // Insights
            decisionInsights: response.decision_insights || [],
            riskAssessments: response.risk_assessments || [],
            opportunityAnalysis: response.opportunity_analysis || [],
            
            // Recommendations
            nextStepRecommendation: response.next_step_recommendation,
            longTermStrategy: response.long_term_strategy,
            
            // Metadata
            confidenceLevel: response.confidence_level,
            dataSources: response.data_sources || [],
            
            // Request details
            request: simulation.request
        };
    }

    // Helper method to extract key metrics from simulation
    extractKeyMetrics(simulation) {
        if (!simulation || !simulation.response || !simulation.response.optimal_path) {
            return null;
        }

        const optimalPath = simulation.response.optimal_path;
        
        return {
            totalEarnings5yr: optimalPath.total_earnings_5yr,
            totalEarnings10yr: optimalPath.total_earnings_10yr,
            peakSalary: optimalPath.peak_salary,
            careerGrowthRate: optimalPath.career_growth_rate,
            overallScore: optimalPath.overall_score,
            
            // Component scores
            salaryScore: optimalPath.salary_score,
            workLifeBalanceScore: optimalPath.work_life_balance_score,
            learningScore: optimalPath.learning_score,
            impactScore: optimalPath.impact_score,
            
            // Career progression
            titleProgression: optimalPath.title_progression || [],
            companiesWorked: optimalPath.companies_worked || [],
            
            // Probability outcomes
            probabilityOutcomes: optimalPath.probability_outcomes || [],
            
            // Decision points
            decisionPoints: optimalPath.decision_points || []
        };
    }

    // Helper method to compare multiple simulations
    compareSimulations(simulations) {
        if (!simulations || simulations.length === 0) {
            return [];
        }

        return simulations.map(sim => {
            const metrics = this.extractKeyMetrics(sim);
            if (!metrics) return null;

            return {
                simulationId: sim.simulation_id,
                offerId: sim.request.offer_id,
                status: sim.status,
                completedAt: sim.updated_at,
                ...metrics,
                // Add comparative metrics
                earningsPerYear5yr: metrics.totalEarnings5yr / 5,
                earningsPerYear10yr: metrics.totalEarnings10yr / 10,
                growthPotential: metrics.careerGrowthRate * 100
            };
        }).filter(Boolean);
    }

    // Helper method to get simulation progress
    getSimulationProgress(simulation) {
        if (!simulation) return null;

        switch (simulation.status) {
            case 'pending':
                return { status: 'pending', message: 'Simulation is queued', progress: 0 };
            case 'running':
                return { status: 'running', message: 'Simulation is running', progress: 50 };
            case 'completed':
                return { status: 'completed', message: 'Simulation completed', progress: 100 };
            case 'failed':
                return { 
                    status: 'failed', 
                    message: simulation.error_message || 'Simulation failed', 
                    progress: 0 
                };
            default:
                return { status: 'unknown', message: 'Unknown status', progress: 0 };
        }
    }
}

const careerSimulationAPI = new CareerSimulationAPI();
export default careerSimulationAPI;
