/**
 * PDF Generation API Client
 * Handles resume PDF generation via HTML-to-PDF
 * Related to UC-053: Export Resume
 */

import api from './base';

const PDFAPI = {
  /**
   * Generate PDF from HTML content
   */
  generatePDF: async (resumeId, htmlContent) => {
    try {
      console.log('[PDFAPI] Generating PDF for resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/generate-pdf`, {
        html: htmlContent,
      });

      console.log('[PDFAPI] PDF generated successfully');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] PDF generation error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to generate PDF');
    }
  },

  /**
   * Generate preview PDF for current resume state
   * Used for real-time preview during editing
   * Sends rendered HTML from React component
   */
  generatePreviewPDF: async (resumeId, resumeData, htmlContent) => {
    try {
      console.log('[PDFAPI] Generating preview PDF for resume:', resumeId);
      console.log('[PDFAPI] Request body size:', htmlContent.length, 'bytes');

      const response = await api.post(`/resumes/${resumeId}/preview-pdf`, {
        html: htmlContent,
      });

      console.log('[PDFAPI] Preview PDF generated successfully');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] Preview PDF generation error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to generate PDF preview');
    }
  },

  /**
   * Convert hex string to PDF blob
   */
  hexToBlob: (hexString) => {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return new Blob([bytes], { type: 'application/pdf' });
  },

  /**
   * Get PDF blob URL for display
   */
  getPDFBlobURL: (hexString) => {
    const blob = PDFAPI.hexToBlob(hexString);
    return URL.createObjectURL(blob);
  },

  /**
   * Generate DOCX from resume data
   */
  generateDOCX: async (resumeId) => {
    try {
      console.log('[PDFAPI] Generating DOCX for resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/generate-docx`, {}, {
        responseType: 'blob'
      });

      console.log('[PDFAPI] DOCX generated successfully');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] DOCX generation error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to generate DOCX');
    }
  },

  /**
   * Validate resume and get feedback
   */
  validateResume: async (resumeId) => {
    try {
      console.log('[PDFAPI] Validating resume:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/validate`);

      console.log('[PDFAPI] Resume validation complete');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] Resume validation error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to validate resume');
    }
  },

  /**
   * Export resume as PDF from stored data
   * Used by ExportResumePage - generates PDF from resume data without needing HTML
   */
  exportPDFFromData: async (resumeId) => {
    try {
      console.log('[PDFAPI] Exporting PDF from resume data:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/export-pdf`, {}, {
        responseType: 'blob'
      });

      console.log('[PDFAPI] PDF exported successfully');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] PDF export error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to export PDF');
    }
  },

  /**
   * Export resume as HTML from stored data
   * Used by ExportResumePage - generates HTML file from resume data
   */
  exportHTMLFromData: async (resumeId) => {
    try {
      console.log('[PDFAPI] Exporting HTML from resume data:', resumeId);
      const response = await api.post(`/resumes/${resumeId}/export-html`, {}, {
        responseType: 'blob'
      });

      console.log('[PDFAPI] HTML exported successfully');
      return response.data;
    } catch (err) {
      console.error('[PDFAPI] HTML export error:', err);
      throw new Error(err?.response?.data?.detail || 'Failed to export HTML');
    }
  },
};

export default PDFAPI;
