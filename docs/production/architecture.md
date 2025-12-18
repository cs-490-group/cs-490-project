# Production Architecture

## Overview
The application uses a React frontend, Node.js/Express backend, and MongoDB database.
It is deployed using Vercel (frontend) and a cloud-hosted backend.

## Architecture Diagram
[ User Browser ]
       |
       v
[ React Frontend (Vercel) ]
       |
       v
[ API Gateway / Express Server ]
       |
       v
[ MongoDB Database ]

## Components
- Frontend: React + Bootstrap
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT
- Hosting: Vercel / Cloud VM
