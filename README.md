# URL Shortener with Analytics

A production-ready full-stack URL Shortener platform where authenticated users can create short URLs, use custom aliases, generate QR codes, manage their own links, and inspect click analytics.

## Features

- User registration and login
- JWT authentication with protected routes
- Password hashing with bcrypt
- PostgreSQL persistence with parameterized queries
- Create short URLs from long URLs
- Optional custom aliases such as `/giri`
- Unique 6-character generated short codes using Nano ID
- Redirect tracking with click count increments
- Visit history stored in PostgreSQL
- Per-link analytics with total clicks, last visit, recent visits, and daily trend chart
- Live total click updates with authenticated WebSocket events
- QR code generation for every short URL
- Copy short URL action
- Delete URLs with owner validation
- Responsive professional dashboard UI
- Loading states, empty states, success alerts, error alerts, and form validation
- Deployment-ready configuration for Vercel and Render

## Folder Structure

```text
url-shortener/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── urlController.js
│   │   │   └── analyticsController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── urlRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── services/
│   │   │   └── shortCodeGenerator.js
│   │   ├── utils/
│   │   │   ├── validateUrl.js
│   │   │   ├── userAgentParser.js
│   │   │   └── geoIp.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   └── socket.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── PublicStats.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UrlCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── database/
│   └── schema.sql
├── test-urls.csv
├── README.md
└── .gitignore
```

## Architecture Diagram

```text
React + Vite + Tailwind
        |
        | Axios REST calls with JWT
        v
Express.js API
        |
        | Controllers -> Services/Utils -> Parameterized SQL
        v
PostgreSQL
        |
        | Redirect route records visits and increments clicks
        v
Analytics Dashboard
```

## Database Setup

Create a PostgreSQL database:

```bash
createdb url_shortener
psql -d url_shortener -f database/schema.sql
```

The schema contains:

- `users`
- `urls`
- `visits`

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

For macOS/Linux:

```bash
cp .env.example .env
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

For macOS/Linux:

```bash
cp .env.example .env
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

Backend `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/url_shortener
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
BASE_URL=http://localhost:5000
```

Frontend `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BASE_SHORT_URL=http://localhost:5000
```

## API Documentation

### Auth

`POST /api/auth/signup`

Request:

```json
{
  "name": "Giri",
  "email": "giri@example.com",
  "password": "secret123"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "name": "Giri",
    "email": "giri@example.com"
  },
  "token": "jwt_token"
}
```

`POST /api/auth/login`

Request:

```json
{
  "email": "giri@example.com",
  "password": "secret123"
}
```

`GET /api/auth/me`

Requires `Authorization: Bearer <token>`.

### URLs

`POST /api/url/create`

Requires `Authorization: Bearer <token>`.

Request:

```json
{
  "originalUrl": "https://github.com/example",
  "customAlias": "giri"
}
```

`customAlias` is optional. If omitted, a 6-character code is generated.

`GET /api/url/myurls`

Returns only the authenticated user's URLs.

`DELETE /api/url/:id`

Deletes a URL only if it belongs to the authenticated user.

`GET /:shortCode`

Redirects to the original URL, increments `urls.clicks`, and creates a row in `visits`.

### Realtime Events

The backend runs Socket.IO on the same host as the REST API. Authenticated clients connect with the JWT token and receive owner-only events.

`url:clicked`

```json
{
  "urlId": 1,
  "shortCode": "abc123",
  "clicks": 6,
  "visit": {
    "id": 10,
    "visited_at": "2026-06-14T07:08:16.960Z"
  }
}
```

### Analytics

`GET /api/analytics/:id`

Requires `Authorization: Bearer <token>`.

Response:

```json
{
  "totalClicks": 5,
  "lastVisited": "2026-06-13T10:30:00.000Z",
  "recentVisits": [
    {
      "id": 1,
      "visited_at": "2026-06-13T10:30:00.000Z"
    }
  ],
  "dailyTrend": [
    {
      "date": "2026-06-13T00:00:00.000Z",
      "clicks": 5
    }
  ]
}
```

## Deployment Guide

### Backend on Render

1. Create a PostgreSQL instance on Render.
2. Create a Web Service from the `backend` folder.
3. Set build command:

   ```bash
   npm install
   ```

4. Set start command:

   ```bash
   npm start
   ```

5. Add environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=https://your-vercel-app.vercel.app`
   - `BASE_URL=https://your-render-api.onrender.com`

6. Run `database/schema.sql` against the production PostgreSQL database.

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the project root to `frontend`.
3. Set build command:

   ```bash
   npm run build
   ```

4. Set output directory:

   ```bash
   dist
   ```

5. Add environment variables:
   - `VITE_API_URL=https://your-render-api.onrender.com/api`
   - `VITE_BASE_SHORT_URL=https://your-render-api.onrender.com`

## Security and Validation

- Passwords are hashed with bcrypt before storage.
- JWTs protect dashboard, URL management, and analytics APIs.
- SQL injection is mitigated through PostgreSQL parameterized queries.
- URL validation only accepts `http` and `https` URLs.
- Custom aliases are limited to letters, numbers, hyphens, and underscores.
- URL deletion checks ownership before deleting.
- CORS is configured with `CLIENT_URL`.

## Assumptions

- Each short URL belongs to one authenticated user.
- Public redirects do not require authentication.
- Custom aliases are globally unique.
- Production database SSL is enabled when `NODE_ENV=production`.
- Temporary IP lookup falls back to "Localhost" or "Unknown Country" for private address spaces.

## AI Planning and Architecture

### Architecture Diagram
```text
React (Vite) + Tailwind CSS (Frontend)
          |
          | Axios REST APIs / WebSockets
          v
Express.js Server (Backend)
          |
          |---> UserAgent Parser & GeoIP Lookup -> PostgreSQL (Visits logs)
          |---> Link Expiry Checks
          |---> Bulk CSV Processing (Transaction loop)
          v
PostgreSQL Database
```

### AI Implementation Plan
1. **Database Schema Enhancements**: Add `expires_at` column to `urls` and analytics columns (`ip_address`, `user_agent`, `browser`, `os`, `device`, `country`) to `visits`.
2. **UserAgent & GeoIP Parsers**: Extract client device metrics safely.
3. **Redirect & Capture Middleware**: Parse and save visitor profile upon redirect. Check Link Expiry and return custom block UI.
4. **Edit Destination API**: Implement validation and safe updates on short links.
5. **Bulk Processing API**: Handle multiple links in a single payload.
6. **Frontend Enhancements**: Build custom Tab controls, CSV local parsing, inline edit form, and Progress analytics blocks.

## Sample Output Logs & Database Entries

### 1. Bulk Shortening Response API
```json
{
  "urls": [
    {
      "id": 8,
      "original_url": "https://www.wikipedia.org",
      "short_code": "wiki-1781446392379",
      "clicks": 0,
      "user_id": 7,
      "created_at": "2026-06-14T14:13:12.386Z",
      "expires_at": null,
      "shortUrl": "http://localhost:5000/wiki-1781446392379"
    }
  ]
}
```

### 2. Visit Tracking Database Entry
```json
{
  "id": 42,
  "url_id": 9,
  "visited_at": "2026-06-14T14:34:54.122Z",
  "ip_address": "8.8.8.8",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
  "browser": "Chrome",
  "os": "Windows",
  "device": "Desktop",
  "country": "United States"
}
```

## Video Demonstration

Please paste your video explanation/demo link (Loom/YouTube) below:
- **Demo Video Link:** `[Insert explanatory video link here]`

---

This project is a part of a hackathon run by [https://katomaran.com](https://katomaran.com)
