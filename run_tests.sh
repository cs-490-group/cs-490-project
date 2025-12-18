#!/bin/bash

# Test Runner Script for CS-490 Project
# Run all tests for frontend and backend with comprehensive coverage

set -e  # Exit on any error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   CS-490 Project Test Runner v2.0      ║${NC}"
echo -e "${YELLOW}║   Frontend + Backend Tests              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
echo ""

# Parse command line arguments
FRONTEND_ONLY=false
BACKEND_ONLY=false
COVERAGE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: ./run_tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --frontend-only   Run only frontend tests"
            echo "  --backend-only    Run only backend tests"
            echo "  --coverage        Include coverage reports"
            echo "  --verbose         Show detailed output"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

TESTS_PASSED=0
TESTS_FAILED=0

# Frontend Tests
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Running Frontend Tests...${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    cd frontend
    
    if [ "$COVERAGE" = true ]; then
        echo -e "${YELLOW}Running with coverage report...${NC}"
        npm run test:frontend-coverage-gate:sprint4
    else
        if [ "$VERBOSE" = true ]; then
            npm run test:frontend -- --verbose
        else
            npm run test:frontend
        fi
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend tests passed${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Frontend tests failed${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    cd ..
    echo ""
fi

# Backend Tests
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Running Backend Tests...${NC}"
    echo -e "${YELLOW}  • test_backend.py${NC}"
    echo -e "${YELLOW}  • test_backend_comprehensive.py${NC}"
    echo -e "${YELLOW}  • test_backend_extended.py${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    cd backend
    
    if [ "$COVERAGE" = true ]; then
        echo -e "${YELLOW}Running all backend tests with coverage...${NC}"
        python -m pytest test_sprint4_automation_engine.py test_sprint4_ai.py --cov=services.automation_engine --cov=services.application_workflow_scheduler --cov=routes.AI --cov=mongo.AI_dao --cov-branch --cov-report=term-missing --cov-report=xml:coverage.xml --cov-fail-under=90 -v
    else
        if [ "$VERBOSE" = true ]; then
            python -m pytest test_backend.py test_backend_comprehensive.py test_backend_extended.py -vv --tb=long
        else
            python -m pytest test_backend.py test_backend_comprehensive.py test_backend_extended.py -v --tb=short
        fi
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Backend tests failed${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    cd ..
    echo ""
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   All Tests Passed Successfully! ✓      ║${NC}"
    echo -e "${GREEN}║   Passed: $TESTS_PASSED                           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   Some Tests Failed ✗                  ║${NC}"
    echo -e "${RED}║   Passed: $TESTS_PASSED | Failed: $TESTS_FAILED                    ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    exit 1
fi

