import api from './base';

export const getCompetitiveAnalysis = async () => {
  try {
    const response = await api.get('/performance-analytics/competitive-analysis');
    return response.data;
  } catch (error) {
    console.error('Error fetching competitive analysis:', error);
    throw error;
  }
};

export const getPerformancePrediction = async () => {
  try {
    const response = await api.get('/performance-analytics/performance-prediction');
    return response.data;
  } catch (error) {
    console.error('Error fetching performance prediction:', error);
    throw error;
  }
};
