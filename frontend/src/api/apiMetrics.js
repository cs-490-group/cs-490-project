/**
 * API Metrics Client
 * UC-117: API Rate Limiting and Error Handling Dashboard
 */

import api from "./base";

/**
 * Get API usage statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} provider - Optional provider filter
 * @param {string} keyOwner - Optional key owner filter
 * @returns {Promise} Usage statistics
 */
export const getUsageStats = async (startDate, endDate, provider = null, keyOwner = null) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (provider) params.provider = provider;
    if (keyOwner) params.key_owner = keyOwner;

    const response = await api.get("/metrics/usage", { params });
    return response.data;
};

/**
 * Get current quota status for all providers
 * @returns {Promise} Quota status
 */
export const getQuotaStatus = async () => {
    const response = await api.get("/metrics/quota");
    return response.data;
};

/**
 * Get recent API errors
 * @param {number} limit - Number of errors to fetch (default: 50)
 * @returns {Promise} Recent errors
 */
export const getRecentErrors = async (limit = 50) => {
    const response = await api.get("/metrics/errors", { params: { limit } });
    return response.data;
};

/**
 * Get fallback events
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Fallback events
 */
export const getFallbackEvents = async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get("/metrics/fallbacks", { params });
    return response.data;
};

/**
 * Get response time data for charting
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} provider - Optional provider filter
 * @returns {Promise} Response time data
 */
export const getResponseTimes = async (startDate, endDate, provider = null) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (provider) params.provider = provider;

    const response = await api.get("/metrics/response-times", { params });
    return response.data;
};

/**
 * Export weekly PDF report
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Blob for PDF download
 */
export const exportWeeklyReport = async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get("/metrics/export/weekly-report", {
        params,
        responseType: "blob", // Important for PDF download
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
        "download",
        `api_metrics_report_${startDate || "latest"}_${endDate || "latest"}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
};
