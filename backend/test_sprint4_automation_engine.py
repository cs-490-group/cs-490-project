import pytest
from unittest.mock import AsyncMock
from datetime import datetime, timezone, timedelta

import services.automation_engine as ae


@pytest.mark.asyncio
async def test_company_matches_with_string_company():
    assert ae._company_matches({"company_contains": "goo"}, {"company": "Google"}) is True
    assert ae._company_matches({"company_contains": "meta"}, {"company": "Google"}) is False


@pytest.mark.asyncio
async def test_company_matches_with_dict_company():
    job = {"company": {"name": "OpenAI"}}
    assert ae._company_matches({"company_contains": "open"}, job) is True
    assert ae._company_matches({"company_contains": "x"}, job) is False


@pytest.mark.asyncio
async def test_status_matches():
    job = {"status": "Applied"}
    assert ae._status_matches({"status_is": "applied"}, job, None, None) is True
    assert ae._status_matches({"status_is": "SUBMITTED"}, job, None, None) is False
    assert ae._status_matches({"status_is": "SUBMITTED"}, job, "Applied", "SUBMITTED") is True


def test_rule_matches_trigger():
    assert ae._rule_matches_trigger({"trigger": "any"}, "on_job_created") is True
    assert ae._rule_matches_trigger({"trigger": "on_job_created"}, "on_job_created") is True
    assert ae._rule_matches_trigger({"trigger": "on_status_change"}, "on_job_created") is False


def test_compute_schedule_datetime_parsing():
    fixed_now = datetime(2025, 1, 1, 10, 0, tzinfo=timezone.utc)
    ae._now_utc = lambda: fixed_now

    dt_today_11 = ae._compute_schedule_datetime({"schedule_time": "11:30"})
    assert dt_today_11.date() == fixed_now.date()
    assert dt_today_11.hour == 11
    assert dt_today_11.minute == 30

    dt_tomorrow_09 = ae._compute_schedule_datetime({"schedule_time": "09:00"})
    assert dt_tomorrow_09.date() == (fixed_now + timedelta(days=1)).date()
    assert dt_tomorrow_09.hour == 9
    assert dt_tomorrow_09.minute == 0

    dt_default = ae._compute_schedule_datetime({"schedule_time": "bad"})
    assert dt_default.hour == 9
    assert dt_default.minute == 0


@pytest.mark.asyncio
async def test_execute_auto_assign_materials_updates_job():
    ae.jobs_dao.update_job = AsyncMock()

    job = {"_id": "job1", "materials": None, "status": None}
    rule = {"actions": {"resume_id": "r1", "cover_letter_id": "c1"}}

    await ae._execute_auto_assign_materials(rule, job)

    ae.jobs_dao.update_job.assert_awaited_once()
    call = ae.jobs_dao.update_job.await_args
    assert call.args[0] == "job1"
    assert call.kwargs == {}
    payload = call.args[1]
    assert payload["materials"]["resume_id"] == "r1"
    assert payload["materials"]["cover_letter_id"] == "c1"


@pytest.mark.asyncio
async def test_execute_auto_create_package_creates_and_links():
    ae.application_workflow_dao.create_application_package = AsyncMock(return_value="pkg123")
    ae.jobs_dao.update_job = AsyncMock()

    job = {"_id": "job1", "uuid": "u1", "title": "T"}
    rule = {"actions": {"resume_id": "r1", "cover_letter_id": "c1"}}

    await ae._execute_auto_create_package(rule, job)

    ae.application_workflow_dao.create_application_package.assert_awaited_once()
    ae.jobs_dao.update_job.assert_awaited_once_with("job1", {"application_package_id": "pkg123"})


@pytest.mark.asyncio
async def test_execute_auto_create_package_no_resume_is_noop():
    ae.application_workflow_dao.create_application_package = AsyncMock()
    ae.jobs_dao.update_job = AsyncMock()

    job = {"_id": "job1", "uuid": "u1"}
    rule = {"actions": {"cover_letter_id": "c1"}}

    await ae._execute_auto_create_package(rule, job)

    ae.application_workflow_dao.create_application_package.assert_not_awaited()
    ae.jobs_dao.update_job.assert_not_awaited()


@pytest.mark.asyncio
async def test_execute_auto_schedule_application_creates_schedule():
    ae.application_workflow_dao.schedule_application = AsyncMock()

    fixed_now = datetime(2025, 1, 1, 8, 0, tzinfo=timezone.utc)
    ae._now_utc = lambda: fixed_now

    job = {"_id": "job1", "uuid": "u1", "application_package_id": "pkgA"}
    rule = {"actions": {"schedule_time": "09:00"}, "rule_type": "auto_schedule_application"}

    await ae._execute_auto_schedule_application(rule, job)

    ae.application_workflow_dao.schedule_application.assert_awaited_once()
    schedule_doc = ae.application_workflow_dao.schedule_application.await_args.args[0]
    assert schedule_doc["uuid"] == "u1"
    assert schedule_doc["job_id"] == "job1"
    assert schedule_doc["package_id"] == "pkgA"
    assert schedule_doc["scheduled_time"].hour == 9


@pytest.mark.asyncio
async def test_execute_auto_submit_application_updates_job():
    ae.jobs_dao.update_job = AsyncMock()

    fixed_now = datetime(2025, 1, 1, 8, 0, tzinfo=timezone.utc)
    ae._now_utc = lambda: fixed_now

    job = {"_id": "job1"}

    await ae._execute_auto_submit_application({}, job)

    ae.jobs_dao.update_job.assert_awaited_once()
    job_id, payload = ae.jobs_dao.update_job.await_args.args
    assert job_id == "job1"
    assert payload["submitted"] is True
    assert payload["status"] == "Applied"


@pytest.mark.asyncio
async def test_process_automation_for_job_filters_rules_and_executes():
    ae.jobs_dao.get_job = AsyncMock(return_value={"_id": "job1", "uuid": "u1", "company": "Google", "status": "NEW"})

    ae.application_workflow_dao.get_enabled_rules = AsyncMock(return_value=[
        {
            "_id": "r1",
            "enabled": True,
            "trigger": "on_job_created",
            "rule_type": "auto_assign_materials",
            "conditions": {"company_contains": "goo"},
            "actions": {"resume_id": "r1"},
        },
        {
            "_id": "r2",
            "enabled": True,
            "trigger": "on_job_created",
            "rule_type": "auto_assign_materials",
            "conditions": {"company_contains": "nope"},
            "actions": {"resume_id": "r2"},
        },
        {
            "_id": "r3",
            "enabled": False,
            "trigger": "on_job_created",
            "rule_type": "auto_assign_materials",
            "conditions": {"company_contains": "goo"},
            "actions": {"resume_id": "r3"},
        },
    ])

    ae.jobs_dao.update_job = AsyncMock()

    await ae.process_automation_for_job("job1", event_type="on_job_created")

    ae.jobs_dao.update_job.assert_awaited_once()


@pytest.mark.asyncio
async def test_process_due_schedules_marks_sent():
    ae.application_workflow_dao.get_due_applications = AsyncMock(return_value=[
        {"_id": "s1", "job_id": "job1", "package_id": "pkg1"}
    ])
    ae.application_workflow_dao.update_schedule_status = AsyncMock()
    ae.jobs_dao.update_job = AsyncMock()

    fixed_now = datetime(2025, 1, 1, 8, 0, tzinfo=timezone.utc)
    ae._now_utc = lambda: fixed_now

    await ae.process_due_schedules(time_window_minutes=5)

    ae.jobs_dao.update_job.assert_awaited_once()
    ae.application_workflow_dao.update_schedule_status.assert_awaited_once_with("s1", "sent")
