# Deployment Rollback Procedure

## When to Roll Back
- Failed deployment
- Critical bug introduced in production
- Performance degradation after release

## Frontend Rollback
1. Revert to the previous stable deployment
2. Redeploy using hosting provider (e.g., Vercel)
3. Confirm frontend loads successfully

## Backend Rollback
1. Revert to last known stable commit or release
2. Restart backend service
3. Monitor logs for errors

## Database Rollback (If Required)
- Restore a recent database snapshot using MongoDB Atlas
- Validate data consistency after restore

## Post-Rollback Verification
- Perform basic smoke tests
- Confirm application stability
- Verify critical features operate correctly
