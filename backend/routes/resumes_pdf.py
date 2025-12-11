"""
PDF Generation Routes
Handles resume PDF generation from HTML
Converts frontend React rendering directly to PDF
Related to UC-053: Export Resume
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse, FileResponse
import io

from mongo.resumes_dao import resumes_dao
from sessions.session_authorizer import authorize
from services.html_pdf_generator import HTMLPDFGenerator
from services.docx_generator import DOCXGenerator

pdf_router = APIRouter(prefix="/resumes")


@pdf_router.post("/{resume_id}/generate-pdf", tags=["resumes"])
async def generate_resume_pdf(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    Generate PDF from HTML content
    Frontend sends the rendered HTML, backend converts to PDF
    Related to UC-053: Export Resume
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Get HTML from request body
        try:
            body = await request.json()
            html = body.get("html", "")

            # Ensure html is a string (convert if needed for robustness)
            if not isinstance(html, str):
                print(f"[PDF Generate] Warning: html is type {type(html)}, converting to string")
                html = str(html)

            html = html.strip() if html else ""

            if not html:
                raise HTTPException(400, "HTML content is required")
        except HTTPException:
            raise
        except Exception as parse_err:
            print(f"[PDF Generate] Error parsing request body: {parse_err}")
            raise HTTPException(400, f"Error parsing request body: {parse_err}")

        # Generate PDF from HTML
        print(f"[PDF Generate] Generating PDF from HTML ({len(html)} chars)")
        print(f"[PDF Generate] HTML type: {type(html)}, first 100 chars: {html[:100]}")
        pdf_bytes = await HTMLPDFGenerator.generate_pdf_from_html(html)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={resume.get('name', 'resume')}.pdf"
            }
        )

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[PDF Error] {error_msg}")
        raise HTTPException(500, f"PDF generation error: {error_msg}")


@pdf_router.post("/{resume_id}/preview-pdf", tags=["resumes"])
async def preview_resume_pdf(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    Generate a preview PDF from HTML content sent by frontend
    Used for live preview during editing
    Related to UC-053: Export Resume
    """
    try:
        print(f"[Preview PDF] Starting preview for resume_id={resume_id}, uuid={uuid}")

        # Fetch original resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Get HTML from request body
        try:
            body = await request.json()
            html = body.get("html", "")

            # Ensure html is a string (convert if needed for robustness)
            if not isinstance(html, str):
                print(f"[Preview PDF] Warning: html is type {type(html)}, converting to string")
                html = str(html)

            html = html.strip() if html else ""

            if not html:
                raise HTTPException(400, "HTML content is required")
        except HTTPException:
            raise
        except Exception as parse_err:
            print(f"[Preview PDF] Error parsing request body: {parse_err}")
            raise HTTPException(400, f"Error parsing request body: {parse_err}")

        # Generate PDF from HTML
        print(f"[Preview PDF] Generating PDF from HTML ({len(html)} chars)")
        print(f"[Preview PDF] HTML type: {type(html)}, first 100 chars: {html[:100]}")
        pdf_bytes = await HTMLPDFGenerator.generate_pdf_from_html(html)

        return {
            "success": True,
            "message": "PDF preview generated successfully",
            "pdf": pdf_bytes.hex(),  # Return as hex string for JSON
        }

    except HTTPException as http:
        print(f"[Preview PDF] HTTP Exception: {http.status_code} - {http.detail}")
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[Preview PDF] Unexpected error: {type(e).__name__}: {error_msg}")
        raise HTTPException(500, f"PDF generation error: {error_msg}")


@pdf_router.post("/{resume_id}/export-pdf", tags=["resumes"])
async def export_resume_pdf(resume_id: str, uuid: str = Depends(authorize)):
    """
    Export resume as PDF from stored resume data
    Used by ExportResumePage - doesn't require HTML from frontend
    Related to UC-051: Resume Export and Formatting
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Build HTML from resume data
        print(f"[Export PDF] Building HTML from resume data for resume_id={resume_id}")
        resume_html = HTMLPDFGenerator.build_resume_html_from_data(resume)

        # Wrap with full HTML document and styles (include colors and fonts)
        full_html = HTMLPDFGenerator.wrap_resume_html(resume_html, resume.get('colors'), resume.get('fonts'))

        # Generate PDF from HTML
        print(f"[Export PDF] Generating PDF from resume data")
        pdf_bytes = await HTMLPDFGenerator.generate_pdf_from_html(full_html)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={resume.get('name', 'resume')}.pdf"
            }
        )

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[Export PDF Error] {error_msg}")
        raise HTTPException(500, f"PDF export error: {error_msg}")


@pdf_router.post("/{resume_id}/export-html", tags=["resumes"])
async def export_resume_html(resume_id: str, uuid: str = Depends(authorize)):
    """
    Export resume as HTML from stored resume data
    Used by ExportResumePage for web-friendly HTML export
    Related to UC-051: Resume Export and Formatting
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Build HTML from resume data
        print(f"[Export HTML] Building HTML from resume data for resume_id={resume_id}")
        resume_html = HTMLPDFGenerator.build_resume_html_from_data(resume)

        # Wrap with full HTML document and styles (include colors and fonts)
        full_html = HTMLPDFGenerator.wrap_resume_html(resume_html, resume.get('colors'), resume.get('fonts'))

        # Encode HTML to bytes
        html_bytes = full_html.encode('utf-8')

        return StreamingResponse(
            io.BytesIO(html_bytes),
            media_type="text/html",
            headers={
                "Content-Disposition": f"attachment; filename={resume.get('name', 'resume')}.html"
            }
        )

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[Export HTML Error] {error_msg}")
        raise HTTPException(500, f"HTML export error: {error_msg}")


@pdf_router.post("/{resume_id}/generate-docx", tags=["resumes"])
async def generate_resume_docx(resume_id: str, request: Request, uuid: str = Depends(authorize)):
    """
    Generate DOCX document from resume data
    Exports resume as Microsoft Word format
    Related to UC-051: Resume Export and Formatting
    """
    try:
        # Fetch resume to verify ownership
        resume = await resumes_dao.get_resume(resume_id)

        if not resume:
            raise HTTPException(404, "Resume not found")

        # Verify ownership
        if resume.get("uuid") != uuid:
            raise HTTPException(403, "Not authorized to access this resume")

        # Generate DOCX from resume data
        print(f"[DOCX Generate] Generating DOCX for resume_id={resume_id}")
        docx_bytes = DOCXGenerator.generate_docx_from_resume(resume)

        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={resume.get('name', 'resume')}.docx"
            }
        )

    except HTTPException as http:
        raise http
    except Exception as e:
        error_msg = str(e)
        print(f"[DOCX Error] {error_msg}")
        raise HTTPException(500, f"DOCX generation error: {error_msg}")
