# Backup Retention Policy

## Overview
The application uses MongoDB Atlas automated backups to ensure data protection
and recovery in case of failure.

## Backup Schedule
- Frequency: Daily automated backups
- Backup Type: Cloud snapshot backups

## Backup Storage
- Backups are stored in MongoDB Atlas managed cloud storage
- Backup storage is physically separate from the primary database cluster

## Retention Policy
- Retention Period: 7 days
- Older backups are automatically deleted after 7 days (Free Tier limitation)
