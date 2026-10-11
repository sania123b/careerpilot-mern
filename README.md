# CareerPilot

A full-stack job search workspace built with React, Vite, Express, MongoDB, and Mongoose. The analyzer uses transparent keyword scoring on the API and does not send descriptions to an external AI service.

## Features

- Create, view, update, and delete applications across five statuses.
- Dashboard totals and application status breakdown.
- Matched/missing job skills, an explainable score, and improvement suggestions.
- Responsive interface, validation, security headers, rate limiting, and API error handling.

## Setup

Requirements: Node.js 20.19+, npm, and MongoDB locally or MongoDB Atlas. Copy `.env.example` to `.env`, set `MONGODB_URI`, then run:

```sh
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Vite runs at http://localhost:5173 and proxies API traffic to port 5000. Variables: `MONGODB_URI` (required), `PORT` (default 5000), `CLIENT_ORIGIN` (default http://localhost:5173), optional frontend `VITE_API_URL` (default /api), and optional `MONGODB_TEST_URI` for the persistence integration test. Keep database credentials out of `VITE_` variables.

## Testing

Run `npm test`, `npm run build`, and `npm run lint`. Format the frontend with `npm --prefix client run format`. Analyzer and HTTP API tests use Node's built-in test runner. The MongoDB CRUD and analytics integration test is skipped unless `MONGODB_TEST_URI` points to a dedicated test database. In PowerShell, run `$env:MONGODB_TEST_URI='mongodb://127.0.0.1:27017/careerpilot_test'; npm test` to enable it. The integration test removes the one record it creates. Never point the test URI at a database containing data you need.

## Scoring

The analyzer detects a small skill vocabulary and common aliases. Score = matched detected skills / all detected skills x 100, equally weighted. If no supported skill is found, no percentage is shown. Suggestions are rule-based; the score cannot assess proficiency, experience, or context.

## AI-assisted development

AI assistance was used to draft and refine implementation code, UI copy, tests, and documentation. The project owner should review and validate the work and be prepared to explain its architecture and scoring choices. This documentation does not claim all code is independently authored or every deployment configuration has been verified.

## Deployment note

This is a single-user portfolio project and does not include authentication or per-user data isolation. Keep it on localhost or add authentication and authorization before exposing the API publicly. Helmet, CORS, input validation, size limits, and analyzer rate limiting are configured; they do not replace authentication.
