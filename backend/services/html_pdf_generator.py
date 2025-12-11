"""
HTML to PDF Generator Service
Converts HTML resume to PDF using Playwright
Renders the exact same styling as the React frontend
"""

from playwright.async_api import async_playwright


class HTMLPDFGenerator:
    """Generate PDF from HTML resume rendering using Playwright"""

    @staticmethod
    async def generate_pdf_from_html_async(html_content: str) -> bytes:
        """
        Generate PDF from HTML content using Playwright

        Args:
            html_content: Complete HTML string with inline styles

        Returns:
            PDF file content as bytes
        """
        # Ensure html_content is a string
        if not isinstance(html_content, str):
            raise TypeError(f"html_content must be a string, got {type(html_content).__name__}")

        browser = None
        try:
            async with async_playwright() as p:
                try:
                    browser = await p.chromium.launch(headless=True)
                except NotImplementedError as e:
                    print(f"[HTMLPDFGenerator] NotImplementedError (Windows asyncio): {e}")
                    raise ValueError("Playwright browser launch failed. Run: python -m playwright install")
                except Exception as e:
                    print(f"[HTMLPDFGenerator] Failed to launch browser: {e}")
                    raise

                page = None
                try:
                    page = await browser.new_page()
                    await page.set_content(html_content)

                    # Generate PDF
                    pdf_bytes = await page.pdf(
                        format='Letter',
                        margin={'top': '0.5in', 'right': '0.5in', 'bottom': '0.5in', 'left': '0.5in'},
                    )

                    return pdf_bytes
                finally:
                    if page:
                        await page.close()
                    if browser:
                        await browser.close()
        except Exception as e:
            print(f"[HTMLPDFGenerator] Error in generate_pdf_from_html_async: {e}")
            raise

    @staticmethod
    async def generate_pdf_from_html(html_content: str) -> bytes:
        """
        Generate PDF from HTML content (async)

        Args:
            html_content: Complete HTML string with inline styles

        Returns:
            PDF file content as bytes
        """
        try:
            pdf_bytes = await HTMLPDFGenerator.generate_pdf_from_html_async(html_content)
            return pdf_bytes
        except Exception as e:
            print(f"[HTMLPDFGenerator] Error generating PDF: {e}")
            raise

    @staticmethod
    def build_resume_html_from_data(resume_data: dict) -> str:
        """
        Build HTML resume from resume data

        Args:
            resume_data: Resume object from MongoDB

        Returns:
            HTML string for the resume
        """
        contact = resume_data.get('contact', {})

        # Build contact header
        contact_html = f"""
        <div class="resume-header">
            <div class="resume-name">{contact.get('name', 'Your Name')}</div>
            <div class="contact-line">
                {contact.get('email', '')} | {contact.get('phone', '')} | {contact.get('address', '')}
            </div>
        </div>
        """

        # Build summary
        summary_html = ""
        if resume_data.get('summary'):
            summary_html = f"""
            <div class="resume-section">
                <div class="section-heading">Professional Summary</div>
                <div class="summary-text">{resume_data['summary']}</div>
            </div>
            """

        # Build experience
        experience_html = ""
        if resume_data.get('experience'):
            experience_html = '<div class="resume-section"><div class="section-heading">Experience</div>'
            for exp in resume_data['experience']:
                experience_html += f"""
                <div class="experience-entry">
                    <div class="exp-header-row">
                        <div class="job-title">{exp.get('title', '')}</div>
                        <div class="date-range">{exp.get('start_date', '')} - {exp.get('end_date', '')}</div>
                    </div>
                    <div class="company-name">{exp.get('company', '')}</div>
                    <div class="description">{exp.get('description', '')}</div>
                </div>
                """
            experience_html += '</div>'

        # Build education
        education_html = ""
        if resume_data.get('education'):
            education_html = '<div class="resume-section"><div class="section-heading">Education</div>'
            for edu in resume_data['education']:
                education_html += f"""
                <div class="education-entry">
                    <div class="degree">{edu.get('degree', '')}</div>
                    <div class="school-name">{edu.get('institution_name', '')}</div>
                    <div class="graduation-year">{edu.get('graduation_date', '')}</div>
                </div>
                """
            education_html += '</div>'

        # Build certifications
        certifications_html = ""
        if resume_data.get('certifications'):
            certifications_html = '<div class="resume-section"><div class="section-heading">Certifications</div>'
            for cert in resume_data['certifications']:
                certifications_html += f"""
                <div class="certification-entry">
                    <div class="certification-header">
                        <strong>{cert.get('name', '')}</strong>
                        <span class="date">{cert.get('date_earned', '')}</span>
                    </div>
                    {f'<p class="issuer">{cert.get("issuer", "")}</p>' if cert.get('issuer') else ''}
                    {f'<p class="cert-id">ID: {cert.get("cert_number", "")}</p>' if cert.get('cert_number') else ''}
                </div>
                """
            certifications_html += '</div>'

        # Build projects
        projects_html = ""
        if resume_data.get('projects'):
            projects_html = '<div class="resume-section"><div class="section-heading">Projects</div>'
            for proj in resume_data['projects']:
                projects_html += f"""
                <div class="project-entry">
                    <div class="project-header">
                        <strong>{proj.get('project_name', '')}</strong>
                        <span class="date">{proj.get('start_date', '')} {f'- {proj.get("end_date", "")}' if proj.get('end_date') else ''}</span>
                    </div>
                    {f'<p class="role">Role: {proj.get("role", "")}</p>' if proj.get('role') else ''}
                    {f'<p class="description">{proj.get("description", "")}</p>' if proj.get('description') else ''}
                    {f'<p class="skills"><strong>Skills:</strong> {", ".join(proj.get("skills", []))}</p>' if proj.get('skills') else ''}
                </div>
                """
            projects_html += '</div>'

        # Build skills
        skills_html = ""
        if resume_data.get('skills'):
            skills_html = '<div class="resume-section"><div class="section-heading">Skills</div><div class="skills-content">'
            for skill in resume_data['skills']:
                skill_text = skill if isinstance(skill, str) else skill.get('name', '')
                skills_html += f'<span class="skill-item">{skill_text}</span> | '
            skills_html = skills_html.rstrip(' | ')  # Remove trailing separator
            skills_html += '</div></div>'

        # Build final HTML
        resume_html = f"""
        <div class="resume-preview template-{resume_data.get('template', 'professional-clean')}">
            {contact_html}
            {summary_html}
            {experience_html}
            {education_html}
            {certifications_html}
            {projects_html}
            {skills_html}
        </div>
        """

        return resume_html

    @staticmethod
    def wrap_resume_html(resume_html: str, colors: dict = None, fonts: dict = None) -> str:
        """
        Wrap resume HTML with proper page styling for PDF/HTML export
        Includes custom colors and fonts if provided

        Args:
            resume_html: The resume content HTML
            colors: Dictionary with 'primary' and 'accent' colors
            fonts: Dictionary with 'heading' and 'body' fonts

        Returns:
            Complete HTML document with CSS for PDF/HTML
        """
        # Extract colors and fonts, with defaults
        primary_color = colors.get('primary', '#1a1a1a') if colors else '#1a1a1a'
        accent_color = colors.get('accent', '#2c3e50') if colors else '#2c3e50'
        heading_font = fonts.get('heading', 'Calibri') if fonts else 'Calibri'
        body_font = fonts.get('body', 'Calibri') if fonts else 'Calibri'

        full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: {body_font}, sans-serif;
            line-height: 1.4;
            color: {primary_color};
            background: white;
        }}

        .resume-preview {{
            max-width: 8.5in;
            margin: 0 auto;
            padding: 40px;
            background: white;
            font-size: 14px;
        }}

        @page {{
            size: 8.5in 11in;
            margin: 0;
        }}

        /* Custom resume styling */
        .resume-header {{
            border-bottom: 3px solid {primary_color};
            margin-bottom: 15px;
        }}

        .resume-name {{
            font-family: {heading_font}, sans-serif;
            font-weight: bold;
            font-size: 24px;
            color: {primary_color};
            margin-bottom: 8px;
        }}

        .contact-line {{
            font-size: 12px;
            color: {accent_color};
        }}

        .resume-section {{
            margin-bottom: 15px;
        }}

        .section-heading {{
            font-family: {heading_font}, sans-serif;
            font-weight: bold;
            font-size: 13px;
            color: {primary_color};
            text-transform: uppercase;
            border-bottom: 2px solid {primary_color};
            padding-bottom: 5px;
            margin-bottom: 10px;
        }}

        .experience-entry, .education-entry, .certification-entry, .project-entry {{
            margin-bottom: 12px;
        }}

        .exp-header-row {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }}

        .job-title, .degree {{
            font-family: {heading_font}, sans-serif;
            font-weight: bold;
            color: {primary_color};
            margin-top: 0;
        }}

        .company-name, .school-name {{
            font-style: italic;
            color: {accent_color};
            margin: 2px 0;
        }}

        .date-range {{
            font-size: 12px;
            color: {accent_color};
        }}

        .description {{
            font-size: 13px;
            line-height: 1.5;
            margin-top: 4px;
        }}

        .skill-item {{
            display: inline;
        }}

        ul {{
            margin-left: 20px;
            margin-top: 5px;
        }}

        li {{
            margin-bottom: 4px;
        }}

        .summary-text {{
            line-height: 1.5;
            margin-top: 8px;
        }}

        .certification-header, .project-header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }}

        .certification-header strong, .project-header strong {{
            font-family: {heading_font}, sans-serif;
            font-weight: bold;
            color: {primary_color};
        }}

        .issuer, .role, .cert-id, .skills {{
            font-size: 12px;
            color: {accent_color};
            margin: 2px 0;
        }}

        .date {{
            font-size: 12px;
            color: {accent_color};
        }}
    </style>
</head>
<body>
    {resume_html}
</body>
</html>
"""
        return full_html
