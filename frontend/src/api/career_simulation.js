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

    async compareOffers(payload) {
        const response = await api.post('/career-simulation/compare', payload);
        return response.data;
    }

    // Get simulation statistics
    async getSimulationStatistics() {
        const response = await api.get('/career-simulation/statistics/me');
        return response.data;
    }

    // Helper method to create a simulation request
    createSimulationRequest(offerId, options = {}) {
        const isBlank = (v) => v === "" || v === null || v === undefined;
        const numOrUndefined = (v) => {
            if (isBlank(v)) return undefined;
            const n = typeof v === "number" ? v : parseFloat(String(v));
            return Number.isFinite(n) ? n : undefined;
        };
        const intOrUndefined = (v) => {
            if (isBlank(v)) return undefined;
            const n = typeof v === "number" ? v : parseInt(String(v), 10);
            return Number.isFinite(n) ? n : undefined;
        };
        const bonusOrUndefined = (v) => {
            if (isBlank(v)) return undefined;
            if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
            const s = String(v).trim();
            if (!s) return undefined;
            const n = Number(s.replace(/,/g, ""));
            if (Number.isFinite(n) && !/%|\$|k$/i.test(s)) {
                return n;
            }
            return s;
        };

        const milestones = (options.milestones || []).map((m) => {
            const year = intOrUndefined(m?.year) ?? 1;
            return {
                year,
                title: isBlank(m?.title) ? undefined : m.title,
                raise_percent: numOrUndefined(m?.raise_percent),
                new_base_salary: numOrUndefined(m?.new_base_salary),
                bonus_expected: numOrUndefined(m?.bonus_expected),
                equity_value: numOrUndefined(m?.equity_value),
            };
        });

        const req = {
            offer_id: offerId,
            simulation_years: options.simulationYears ?? 5,
            success_criteria: options.successCriteria ?? options.success_criteria ?? [
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
        };

        req.personal_growth_rate = numOrUndefined(options.personalGrowthRate) ?? 0.5;
        req.risk_tolerance = numOrUndefined(options.riskTolerance) ?? 0.5;
        req.job_change_frequency = numOrUndefined(options.jobChangeFrequency) ?? 2.5;
        req.geographic_flexibility = options.geographicFlexibility ?? true;
        req.industry_switch_willingness = options.industrySwitchWillingness ?? false;
        req.inflation_rate = numOrUndefined(options.inflationRate) ?? 0.025;
        req.market_growth_rate = numOrUndefined(options.marketGrowthRate) ?? 0.05;
        if (!isBlank(options.industryTrendOverride)) req.industry_trend_override = options.industryTrendOverride;

        const startingSalary = numOrUndefined(options.startingSalary ?? options.starting_salary);
        if (startingSalary !== undefined) req.starting_salary = startingSalary;

        const annualRaisePercent = numOrUndefined(options.annualRaisePercent ?? options.annual_raise_percent);
        if (annualRaisePercent !== undefined) req.annual_raise_percent = annualRaisePercent;

        const raiseScenarios = options.raiseScenarios ?? options.raise_scenarios;
        if (raiseScenarios && typeof raiseScenarios === "object") {
            const normalized = {
                conservative: numOrUndefined(raiseScenarios.conservative),
                expected: numOrUndefined(raiseScenarios.expected),
                optimistic: numOrUndefined(raiseScenarios.optimistic),
            };
            if (Object.values(normalized).some((v) => v !== undefined)) {
                req.raise_scenarios = normalized;
            }
        }

        if (milestones.length > 0) req.milestones = milestones;

        const annualBonus = bonusOrUndefined(options.annualBonus ?? options.annual_bonus);
        if (annualBonus !== undefined) req.annual_bonus = annualBonus;

        const annualEquity = numOrUndefined(options.annualEquity ?? options.annual_equity);
        if (annualEquity !== undefined) req.annual_equity = annualEquity;

        if (!isBlank(options.notes)) req.notes = options.notes;

        return req;
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
