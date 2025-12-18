/**
 * Resume Export Themes
 * Provides multiple formatting themes for resume exports
 * Related to UC-051: Resume Export and Formatting
 */

export const EXPORT_THEMES = {
  professional: {
    name: 'Professional',
    description: 'Clean and professional - suitable for most industries',
    colors: {
      primary: '#1a1a1a',
      accent: '#0066cc',
      background: '#ffffff',
      border: '#cccccc',
      text: '#333333'
    },
    fonts: {
      heading: 'Arial, sans-serif',
      body: 'Calibri, sans-serif',
      mono: 'Courier New, monospace'
    },
    spacing: {
      sectionMargin: '12pt',
      itemMargin: '8pt',
      lineHeight: '1.5'
    }
  },

  modern: {
    name: 'Modern',
    description: 'Contemporary design with bold accents',
    colors: {
      primary: '#2c3e50',
      accent: '#3498db',
      background: '#ecf0f1',
      border: '#bdc3c7',
      text: '#34495e'
    },
    fonts: {
      heading: 'Segoe UI, sans-serif',
      body: 'Segoe UI, sans-serif',
      mono: 'Monaco, monospace'
    },
    spacing: {
      sectionMargin: '14pt',
      itemMargin: '10pt',
      lineHeight: '1.6'
    }
  },

  creative: {
    name: 'Creative',
    description: 'Colorful design for creative industries',
    colors: {
      primary: '#e74c3c',
      accent: '#f39c12',
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#2c3e50'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Open Sans, sans-serif',
      mono: 'Inconsolata, monospace'
    },
    spacing: {
      sectionMargin: '16pt',
      itemMargin: '10pt',
      lineHeight: '1.7'
    }
  },

  minimal: {
    name: 'Minimal',
    description: 'Simplistic and elegant design',
    colors: {
      primary: '#000000',
      accent: '#666666',
      background: '#ffffff',
      border: '#e0e0e0',
      text: '#333333'
    },
    fonts: {
      heading: 'Helvetica Neue, sans-serif',
      body: 'Helvetica Neue, sans-serif',
      mono: 'Monaco, monospace'
    },
    spacing: {
      sectionMargin: '10pt',
      itemMargin: '6pt',
      lineHeight: '1.4'
    }
  },

  academic: {
    name: 'Academic',
    description: 'Traditional format for academic/research roles',
    colors: {
      primary: '#003366',
      accent: '#666666',
      background: '#ffffff',
      border: '#cccccc',
      text: '#000000'
    },
    fonts: {
      heading: 'Times New Roman, serif',
      body: 'Times New Roman, serif',
      mono: 'Courier New, monospace'
    },
    spacing: {
      sectionMargin: '12pt',
      itemMargin: '8pt',
      lineHeight: '1.5'
    }
  },

  tech: {
    name: 'Tech',
    description: 'Modern design for tech and IT roles',
    colors: {
      primary: '#0052cc',
      accent: '#00a3e0',
      background: '#f5f5f5',
      border: '#d0d0d0',
      text: '#1f1f1f'
    },
    fonts: {
      heading: 'Courier New, monospace',
      body: 'Trebuchet MS, sans-serif',
      mono: 'Consolas, monospace'
    },
    spacing: {
      sectionMargin: '14pt',
      itemMargin: '8pt',
      lineHeight: '1.5'
    }
  }
};

/**
 * Generate CSS for a theme
 */
export const generateThemeCSS = (theme) => {
  return `
    :root {
      --primary-color: ${theme.colors.primary};
      --accent-color: ${theme.colors.accent};
      --background-color: ${theme.colors.background};
      --border-color: ${theme.colors.border};
      --text-color: ${theme.colors.text};
      --heading-font: ${theme.fonts.heading};
      --body-font: ${theme.fonts.body};
      --mono-font: ${theme.fonts.mono};
      --section-margin: ${theme.spacing.sectionMargin};
      --item-margin: ${theme.spacing.itemMargin};
      --line-height: ${theme.spacing.lineHeight};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--body-font);
      color: var(--text-color);
      background-color: var(--background-color);
      line-height: var(--line-height);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font);
      color: var(--primary-color);
      margin: var(--section-margin) 0 var(--item-margin) 0;
    }

    h1 {
      font-size: 24pt;
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 8pt;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 4pt;
    }

    .resume-section {
      margin-bottom: var(--section-margin);
      page-break-inside: avoid;
    }

    .resume-entry {
      margin-bottom: var(--item-margin);
      page-break-inside: avoid;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4pt;
    }

    .entry-title {
      font-weight: bold;
      color: var(--primary-color);
    }

    .entry-subtitle {
      font-style: italic;
      color: var(--accent-color);
    }

    .entry-date {
      font-size: 10pt;
      color: #666;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
      margin: 6pt 0;
    }

    .skill-badge {
      background-color: var(--accent-color);
      color: white;
      padding: 2pt 6pt;
      border-radius: 3pt;
      font-size: 9pt;
    }

    @media print {
      body {
        background-color: white;
      }

      .no-print {
        display: none;
      }

      .resume-section {
        page-break-inside: avoid;
      }

      .resume-entry {
        page-break-inside: avoid;
      }
    }
  `;
};

/**
 * Get theme by name
 */
export const getThemeByName = (themeName) => {
  return EXPORT_THEMES[themeName] || EXPORT_THEMES.professional;
};

/**
 * Get all available themes
 */
export const getAllThemes = () => {
  return Object.entries(EXPORT_THEMES).map(([key, value]) => ({
    id: key,
    ...value
  }));
};
