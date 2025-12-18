@echo off
REM Test Runner Script for CS-490 Project (Windows)
REM Run all tests for frontend and backend with comprehensive coverage

setlocal enabledelayedexpansion

set "FRONTEND_ONLY=false"
set "BACKEND_ONLY=false"
set "COVERAGE=false"
set "VERBOSE=false"
set "TESTS_PASSED=0"
set "TESTS_FAILED=0"

REM Parse arguments
:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--frontend-only" (
    set "FRONTEND_ONLY=true"
    shift
    goto parse_args
)
if "%~1"=="--backend-only" (
    set "BACKEND_ONLY=true"
    shift
    goto parse_args
)
if "%~1"=="--coverage" (
    set "COVERAGE=true"
    shift
    goto parse_args
)
if "%~1"=="--verbose" (
    set "VERBOSE=true"
    shift
    goto parse_args
)
if "%~1"=="--help" (
    echo Usage: run_tests.bat [options]
    echo.
    echo Options:
    echo   --frontend-only   Run only frontend tests
    echo   --backend-only    Run only backend tests
    echo   --coverage        Include coverage reports
    echo   --verbose         Show detailed output
    echo   --help           Show this help message
    exit /b 0
)
shift
goto parse_args

:end_parse
cls
echo.
echo ======================================
echo    CS-490 Project Test Runner v2.0
echo    Frontend + Backend Tests
echo ======================================
echo.

REM Frontend Tests
if NOT "%BACKEND_ONLY%"=="true" (
    echo.
    echo =======================================
    echo Running Frontend Tests...
    echo =======================================
    cd frontend
    
    if "%COVERAGE%"=="true" (
        echo Running with coverage report...
        call npm run test:frontend-coverage-gate:sprint4
    ) else (
        if "%VERBOSE%"=="true" (
            call npm run test:frontend -- --verbose
        ) else (
            call npm run test:frontend
        )
    )
    
    if errorlevel 1 (
        echo [FAILED] Frontend tests failed!
        set /a TESTS_FAILED=!TESTS_FAILED!+1
    ) else (
        echo [OK] Frontend tests passed
        set /a TESTS_PASSED=!TESTS_PASSED!+1
    )
    cd ..
    echo.
)

REM Backend Tests
if NOT "%FRONTEND_ONLY%"=="true" (
    echo.
    echo =======================================
    echo Running Backend Tests...
    echo   - test_backend.py
    echo   - test_backend_comprehensive.py
    echo   - test_backend_extended.py
    echo =======================================
    cd backend
    
    if "%COVERAGE%"=="true" (
        echo Running all backend tests with coverage...
        python -m pytest test_sprint4_automation_engine.py test_sprint4_ai.py --cov=services.automation_engine --cov=services.application_workflow_scheduler --cov=routes.AI --cov=mongo.AI_dao --cov-branch --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=90 -v
    ) else (
        if "%VERBOSE%"=="true" (
            python -m pytest test_backend.py test_backend_comprehensive.py test_backend_extended.py -vv --tb=long
        ) else (
            python -m pytest test_backend.py test_backend_comprehensive.py test_backend_extended.py -v --tb=short
        )
    )
    
    if errorlevel 1 (
        echo [FAILED] Backend tests failed!
        set /a TESTS_FAILED=!TESTS_FAILED!+1
    ) else (
        echo [OK] Backend tests passed
        set /a TESTS_PASSED=!TESTS_PASSED!+1
    )
    cd ..
    echo.
)

REM Summary
echo =======================================
echo Test Summary
echo =======================================

if "%TESTS_FAILED%"=="0" (
    echo.
    echo ======================================
    echo    All Tests Passed Successfully! ^_^
    echo    Passed: %TESTS_PASSED%
    echo ======================================
    echo.
    exit /b 0
) else (
    echo.
    echo ======================================
    echo    Some Tests Failed :(
    echo    Passed: %TESTS_PASSED% / Failed: %TESTS_FAILED%
    echo ======================================
    echo.
    exit /b 1
)
