# Deployment

## Backend: Render

Use the root `render.yaml` blueprint to create:

- `shorturl-api` web service from `backend`
- `shorturl-db` PostgreSQL database

Render will generate `JWT_SECRET` and wire `DATABASE_URL` from the database.

Set these prompted environment variables in Render:

```text
CLIENT_URL=https://your-vercel-app.vercel.app
BASE_URL=https://your-render-service.onrender.com
```

After the database is created, run `database/schema.sql` against the production database.

## Frontend: Vercel

Create a Vercel project with:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Set these Vercel environment variables:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
VITE_BASE_SHORT_URL=https://your-render-service.onrender.com
```

The `frontend/vercel.json` rewrite keeps React Router routes working after refresh.
