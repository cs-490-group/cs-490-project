"""
API Metrics Weekly Report Generator
UC-117: Generate weekly PDF reports for API usage, errors, and performance metrics
"""

from io import BytesIO
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

from mongo.api_metrics_dao import api_metrics_dao
from services.api_key_manager import api_key_manager


async def generate_weekly_pdf_report(start_date: datetime, end_date: datetime) -> BytesIO:
    """
    Generate a weekly PDF report of API metrics

    Args:
        start_date: Start of reporting period
        end_date: End of reporting period

    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title=f"API Metrics Report - {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f4788'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2e5c8a'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )

    # Title
    story.append(Paragraph("API Usage & Performance Report", title_style))
    story.append(Paragraph(
        f"Period: {start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}",
        styles['Normal']
    ))
    story.append(Spacer(1, 0.3 * inch))

    # Fetch data
    usage_stats = await api_metrics_dao.get_usage_stats(start_date, end_date)
    recent_errors = await api_metrics_dao.get_recent_errors(limit=20)
    fallback_events = await api_metrics_dao.get_fallback_events(start_date, end_date)

    # Get monthly quota status (for Cohere)
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    cohere_monthly_usage = await api_metrics_dao.get_monthly_usage("cohere", current_month)
    cohere_limit = api_key_manager.get_quota_limit("cohere")

    # === EXECUTIVE SUMMARY ===
    story.append(Paragraph("Executive Summary", heading_style))

    total_calls = sum(stat['total_calls'] for stat in usage_stats)
    total_failed = sum(stat['failed_calls'] for stat in usage_stats)
    total_successful = sum(stat['successful_calls'] for stat in usage_stats)
    success_rate = (total_successful / total_calls * 100) if total_calls > 0 else 0
    avg_duration = sum(stat['avg_duration_ms'] for stat in usage_stats) / len(usage_stats) if usage_stats else 0

    summary_data = [
        ["Metric", "Value"],
        ["Total API Calls", str(total_calls)],
        ["Successful Calls", f"{total_successful} ({success_rate:.1f}%)"],
        ["Failed Calls", str(total_failed)],
        ["Average Response Time", f"{avg_duration:.0f}ms"],
        ["Fallback Events", str(len(fallback_events))],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e5c8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3 * inch))

    # === QUOTA STATUS ===
    story.append(Paragraph("Quota Status", heading_style))

    remaining = cohere_limit - cohere_monthly_usage
    percent_used = (cohere_monthly_usage / cohere_limit * 100) if cohere_limit > 0 else 0
    percent_remaining = 100 - percent_used

    # Predict exhaustion date based on daily usage rate
    days_in_period = (end_date - start_date).days or 1
    daily_rate = total_calls / days_in_period
    days_until_exhausted = (remaining / daily_rate) if daily_rate > 0 else float('inf')
    exhaustion_date = datetime.now(timezone.utc) + timedelta(days=days_until_exhausted)

    quota_data = [
        ["Provider", "Used", "Limit", "Remaining", "% Remaining"],
        ["Cohere", str(cohere_monthly_usage), str(cohere_limit), str(remaining), f"{percent_remaining:.1f}%"],
    ]

    quota_table = Table(quota_data, colWidths=[1.5 * inch, 1 * inch, 1 * inch, 1.5 * inch, 1.5 * inch])
    quota_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e5c8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue if percent_remaining > 15 else colors.lightcoral),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(quota_table)

    if percent_remaining < 15:
        story.append(Spacer(1, 0.1 * inch))
        warning = Paragraph(
            f"<b>⚠ WARNING:</b> Less than 15% quota remaining! Predicted exhaustion: {exhaustion_date.strftime('%B %d, %Y')}",
            ParagraphStyle('Warning', parent=styles['Normal'], textColor=colors.red, fontSize=10, fontName='Helvetica-Bold')
        )
        story.append(warning)

    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(
        f"Predicted quota exhaustion date: <b>{exhaustion_date.strftime('%B %d, %Y')}</b> (based on current usage rate of {daily_rate:.1f} calls/day)",
        styles['Normal']
    ))
    story.append(Spacer(1, 0.3 * inch))

    # === USAGE BY PROVIDER ===
    story.append(Paragraph("Usage by Provider & Key Owner", heading_style))

    usage_data = [["Provider", "Key Owner", "Calls", "Success Rate", "Avg Response Time"]]
    for stat in usage_stats:
        success_rate = (stat['successful_calls'] / stat['total_calls'] * 100) if stat['total_calls'] > 0 else 0
        usage_data.append([
            stat['provider'],
            stat['key_owner'],
            str(stat['total_calls']),
            f"{success_rate:.1f}%",
            f"{stat['avg_duration_ms']:.0f}ms"
        ])

    usage_table = Table(usage_data, colWidths=[1.5 * inch, 1.5 * inch, 1.2 * inch, 1.5 * inch, 1.8 * inch])
    usage_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e5c8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(usage_table)
    story.append(Spacer(1, 0.3 * inch))

    # === FALLBACK EVENTS ===
    story.append(Paragraph("Fallback Events", heading_style))

    if fallback_events:
        story.append(Paragraph(
            f"Total fallback events: <b>{len(fallback_events)}</b>",
            styles['Normal']
        ))
        story.append(Paragraph(
            f"Successful fallbacks: <b>{sum(1 for e in fallback_events if e.get('success'))}</b>",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.2 * inch))

        fallback_data = [["Timestamp", "Primary → Fallback", "Status", "Error"]]
        for event in fallback_events[:10]:  # Show first 10
            timestamp = event['timestamp'].strftime('%Y-%m-%d %H:%M')
            status = "✓ Success" if event.get('success') else "✗ Failed"
            error = event.get('original_error', '')[:40] + "..." if len(event.get('original_error', '')) > 40 else event.get('original_error', '')
            fallback_data.append([
                timestamp,
                f"{event['primary_provider']} → {event['fallback_provider']}",
                status,
                error
            ])

        fallback_table = Table(fallback_data, colWidths=[1.5 * inch, 1.8 * inch, 1.2 * inch, 2 * inch])
        fallback_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e5c8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(fallback_table)
    else:
        story.append(Paragraph("No fallback events during this period.", styles['Normal']))

    story.append(Spacer(1, 0.3 * inch))

    # === RECENT ERRORS ===
    story.append(Paragraph("Recent Errors", heading_style))

    if recent_errors:
        story.append(Paragraph(
            f"Showing the {min(len(recent_errors), 10)} most recent errors:",
            styles['Normal']
        ))
        story.append(Spacer(1, 0.1 * inch))

        error_data = [["Timestamp", "Provider", "Key Owner", "Error Message"]]
        for error in recent_errors[:10]:
            timestamp = error['timestamp'].strftime('%Y-%m-%d %H:%M')
            error_msg = error.get('error_message', '')[:50] + "..." if len(error.get('error_message', '')) > 50 else error.get('error_message', '')
            error_data.append([
                timestamp,
                error['provider'],
                error['key_owner'],
                error_msg
            ])

        error_table = Table(error_data, colWidths=[1.3 * inch, 1 * inch, 1.2 * inch, 3 * inch])
        error_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2e5c8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(error_table)
    else:
        story.append(Paragraph("No errors during this period! 🎉", styles['Normal']))

    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
