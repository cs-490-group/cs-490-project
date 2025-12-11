// renderTemplate.js
export async function renderTemplate(templatePath) {
  try {
    // Ensure the templates are served from the public folder
    const res = await fetch(`/templates/coverLetter/${templatePath}`);
    if (!res.ok) throw new Error(`Failed to fetch template: ${templatePath}`);

    const html = await res.text();

    // Wrap in full HTML if not already
    if (!html.includes("<html")) {
      return `<html>
                <head>
                  <style>
                    body {
                      padding: 20px;
                      font-family: sans-serif;
                    }
                  </style>
                </head>
                <body>${html}</body>
              </html>`;
    }

    return html;
  } catch (err) {
    console.error("Error rendering template:", err);
    return "<p>Failed to load template</p>";
  }
}
