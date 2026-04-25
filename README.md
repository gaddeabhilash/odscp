# Client Project Tracking Portal

Complete backend for managing projects, handling media uploads via Cloudinary, and presenting an access-controlled timeline update for clients.

## Quickstart

1. Fill out `.env` using `.env.example` as a template. You must have MongoDB and Cloudinary configured.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot up the server:
   ```bash
   npm start
   ```

## Routes Overview

- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Users**: `/api/users` (Admin)
- **Projects**: `/api/projects`, `/api/projects/client/:clientId`
- **Updates**: `/api/updates` (upload media), `/api/updates/project/:projectId`, `/api/updates/:id`
- **Files**: `/api/files` (upload files), `/api/files/project/:projectId`
