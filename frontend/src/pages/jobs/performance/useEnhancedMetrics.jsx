import { useState, useEffect } from "react";
import { useMetricsCalculator } from "./useMetricsCalculator";
import MaterialComparisonAPI from "../../../api/materialComparison";

/**
 * Enhanced metrics hook that combines job metrics with material comparison data
 * UC-119: Application Success Optimization Dashboard
 */
export function useEnhancedMetrics(filteredJobs) {
  const baseMetrics = useMetricsCalculator(filteredJobs);
  const [materialData, setMaterialData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        setLoading(true);

        // Fetch material comparison data (includes A/B tests and recommendations)
        const materialResponse = await MaterialComparisonAPI.getCombinedComparison();
        setMaterialData(materialResponse.data);

        // Fetch trends data
        const trendsResponse = await MaterialComparisonAPI.getSuccessTrends(12);
        setTrendsData(trendsResponse.data);

      } catch (error) {
        console.error("Error fetching enhanced metrics:", error);
        // Set empty data on error
        setMaterialData({ resumes: [], cover_letters: [], ab_tests: {}, recommendations: [] });
        setTrendsData({ trends: [], trend_direction: "insufficient_data" });
      } finally {
        setLoading(false);
      }
    };

    fetchEnhancedData();
  }, []);

  // Extract top performing materials
  const getTopPerformingMaterials = () => {
    if (!materialData) return { resume: null, coverLetter: null };

    const topResume = materialData.resumes
      .filter(r => r.applications_count >= 5)
      .sort((a, b) => b.response_rate - a.response_rate)[0] || null;

    const topCoverLetter = materialData.cover_letters
      .filter(l => l.applications_count >= 5)
      .sort((a, b) => b.response_rate - a.response_rate)[0] || null;

    return { resume: topResume, coverLetter: topCoverLetter };
  };

  // Combine recommendations from base metrics and material data
  const getCombinedRecommendations = () => {
    const baseRecs = baseMetrics.recommendations || [];
    const materialRecs = materialData?.recommendations || [];

    // Convert material recommendations to base format
    const formattedMaterialRecs = materialRecs.map(rec => ({
      type: rec.category,
      message: `${rec.title}: ${rec.action}`,
      confidence: rec.confidence,
      priority: rec.priority
    }));

    // Combine and sort by priority
    const allRecs = [...baseRecs, ...formattedMaterialRecs];
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return allRecs.sort((a, b) =>
      (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
    );
  };

  return {
    ...baseMetrics,
    // Enhanced material data
    materialData: materialData || { resumes: [], cover_letters: [], ab_tests: {}, recommendations: [] },
    trendsData: trendsData || { trends: [], trend_direction: "insufficient_data" },
    topPerformingMaterials: getTopPerformingMaterials(),
    combinedRecommendations: getCombinedRecommendations(),
    loading
  };
}
