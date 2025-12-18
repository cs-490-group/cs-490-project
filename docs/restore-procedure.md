# Database Restore Procedure

## When to Restore
A database restore may be required in cases of:
- Accidental data deletion
- Data corruption
- Failed deployment
- Production outage

## Restore Steps (MongoDB Atlas)

1. Log in to MongoDB Atlas
2. Select the correct Project
3. Navigate to:
   - Database → Clusters
4. Click on the cluster name
5. Open the "Backups" or "Snapshots" tab
6. Select the desired backup snapshot
7. Click "Restore"

## Restore Options
- Restore to a new cluster (recommended for safety)
- Restore to the existing cluster (overwrites current data)

## After Restore
If restored to a new cluster:
1. Copy the new cluster connection string
2. Update the backend environment variable:

```env
MONGO_URI=<new_connection_string>
