# Deployment Runbook

## Frontend Deployment
1. Merge changes into `main`
2. Vercel automatically triggers deployment
3. Verify build passes
4. Check production URL

## Backend Deployment
1. Pull latest code on server
2. Install dependencies:
   npm install
3. Set environment variables
4. Start server:
   npm run start
5. Verify API health endpoint

## Rollback Procedure
1. Revert commit
2. Redeploy previous stable version
