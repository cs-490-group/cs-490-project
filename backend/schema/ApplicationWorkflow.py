from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# ============================================
# APPLICATION PACKAGE SCHEMAS (UC-069)
# ============================================

class ApplicationPackage(BaseModel):
    """Schema for application packages (resume + cover letter + portfolio)"""
    name: Optional[str] = None
    description: Optional[str] = None
    resume_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    portfolio_ids: Optional[List[str]] = []  # List of project/portfolio item IDs
    status: Optional[str] = "draft"  # draft, ready, sent
    target_industries: Optional[List[str]] = []
    target_roles: Optional[List[str]] = []
    notes: Optional[str] = None

class ApplicationPackageUpdate(BaseModel):
    """Schema for updating application packages"""
    name: Optional[str] = None
    description: Optional[str] = None
    resume_id: Optional[str] = None
    cover_letter_id: Optional[str] = None
    portfolio_ids: Optional[List[str]] = None
    status: Optional[str] = None
    target_industries: Optional[List[str]] = None
    target_roles: Optional[List[str]] = None
    notes: Optional[str] = None

# ============================================
# APPLICATION SCHEDULING SCHEMAS (UC-069)
# ============================================

class ApplicationSchedule(BaseModel):
    """Schema for scheduled application submissions"""
    job_id: Optional[str] = None
    package_id: Optional[str] = None
    scheduled_time: str  # ISO datetime string
    submission_method: Optional[str] = "manual"  # manual, automated, email
    application_url: Optional[str] = None
    notes: Optional[str] = None
    reminder_before_minutes: Optional[int] = 60
    auto_followup: Optional[bool] = False
    followup_days: Optional[int] = 7

class ScheduleUpdate(BaseModel):
    """Schema for updating scheduled applications"""
    scheduled_time: Optional[str] = None
    submission_method: Optional[str] = None
    application_url: Optional[str] = None
    notes: Optional[str] = None
    reminder_before_minutes: Optional[int] = None
    auto_followup: Optional[bool] = None
    followup_days: Optional[int] = None

# ============================================
# RESPONSE TEMPLATE SCHEMAS (UC-069)
# ============================================

class ResponseTemplate(BaseModel):
    """Schema for application response templates"""
    name: str
    category: str  # screening_questions, why_company, why_role, strengths, etc.
    content: str
    variables: Optional[List[str]] = []  # List of variables like {company_name}, {role}
    tags: Optional[List[str]] = []
    is_default: Optional[bool] = False

class TemplateUpdate(BaseModel):
    """Schema for updating response templates"""
    name: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    variables: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_default: Optional[bool] = None

# ============================================
# AUTOMATION RULE SCHEMAS (UC-069)
# ============================================

class AutomationRule(BaseModel):
    uuid: Optional[str] = None
    name: str
    enabled: bool = True
    trigger: str  # "on_job_created", "on_status_change", etc.
    rule_type: str  # AUTO TYPES: "auto_assign_materials", "auto_create_package", "auto_submit", "auto_schedule"
    conditions: Optional[Dict] = None  # ex: {"company": "Google"}
    actions: Dict  # ex: {"resume_id": "...", "cover_letter_id": "...", "schedule_time": "09:00"}
    date_created: Optional[datetime] = None
    date_updated: Optional[datetime] = None
    execution_count: Optional[int] = 0


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    conditions: Optional[Dict] = None
    actions: Optional[Dict] = None
    rule_type: Optional[str] = None

# ============================================
# BULK OPERATION SCHEMAS (UC-069)
# ============================================

class BulkPackageCreate(BaseModel):
    """Schema for bulk package creation"""
    packages: List[ApplicationPackage]

class BulkScheduleCreate(BaseModel):
    """Schema for bulk scheduling"""
    schedules: List[ApplicationSchedule]

class BulkScheduleCancel(BaseModel):
    """Schema for bulk schedule cancellation"""
    schedule_ids: List[str]
    reason: Optional[str] = None

# ============================================
# APPLICATION CHECKLIST SCHEMAS (UC-069)
# ============================================

class ChecklistItem(BaseModel):
    """Schema for checklist items"""
    text: str
    completed: Optional[bool] = False
    required: Optional[bool] = False
    order: Optional[int] = 0

class ApplicationChecklist(BaseModel):
    """Schema for application checklists"""
    job_id: str
    items: List[ChecklistItem]
    auto_populate: Optional[bool] = True  # Auto-populate from job requirements

class ChecklistUpdate(BaseModel):
    """Schema for updating checklists"""
    items: Optional[List[ChecklistItem]] = None

# ============================================
# STATUS MONITORING SCHEMAS (UC-070)
# ============================================

class StatusUpdate(BaseModel):
    """Schema for manual status updates"""
    status: str
    notes: Optional[str] = None
    source: Optional[str] = "manual"  # manual, email, automated
    notify: Optional[bool] = True

class StatusChangeNotification(BaseModel):
    """Schema for status change notifications"""
    job_id: str
    old_status: str
    new_status: str
    timestamp: str
    source: str
    notification_sent: Optional[bool] = False

# ============================================
# ANALYTICS SCHEMAS (UC-072)
# ============================================

class DateRange(BaseModel):
    """Schema for date range filters"""
    start: str  # ISO datetime
    end: str  # ISO datetime

class ApplicationGoal(BaseModel):
    """Schema for application goals"""
    goal_type: str  # applications_per_week, interview_rate, offer_rate, response_time
    target_value: float
    current_value: Optional[float] = 0
    deadline: Optional[str] = None
    description: Optional[str] = None

class GoalUpdate(BaseModel):
    """Schema for updating goals"""
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    deadline: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # active, completed, abandoned

# ============================================
# FOLLOW-UP REMINDER SCHEMAS (UC-069)
# ============================================

class FollowUpReminder(BaseModel):
    """Schema for follow-up reminders"""
    job_id: str
    reminder_type: str  # application_followup, interview_thankyou, status_check
    scheduled_date: str  # ISO datetime
    message_template: Optional[str] = None
    auto_send: Optional[bool] = False
    completed: Optional[bool] = False

class ReminderUpdate(BaseModel):
    """Schema for updating reminders"""
    scheduled_date: Optional[str] = None
    message_template: Optional[str] = None
    auto_send: Optional[bool] = None
    completed: Optional[bool] = None