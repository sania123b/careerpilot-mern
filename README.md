# CareerPilot

A full-stack job search workspace built with React, Vite, Express, MongoDB, and Mongoose for the StartupMeu Software Engineer Intern — MERN Stack assessment. The analyzer runs locally in the API: it uses transparent keyword matching, not an AI model, and does not send job descriptions to an external AI service. Its score is an estimate based only on detected keywords and is not a guarantee of job suitability.

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

Vite runs at http://localhost:5173 and proxies API traffic to port 5000. The backend loads `.env` from the repository root. Variables: `MONGODB_URI` (required), `PORT` (default 5000), `CLIENT_ORIGIN` (default http://localhost:5173), optional frontend `VITE_API_URL` (default /api), and optional `MONGODB_TEST_URI` for the persistence integration test. Keep database credentials out of `VITE_` variables.

## Testing

Run `npm test`, `npm run build`, and `npm run lint`. Format the frontend with `npm --prefix client run format`. Analyzer and HTTP API tests use Node's built-in test runner. The MongoDB CRUD and analytics integration test is skipped unless `MONGODB_TEST_URI` points to a dedicated test database. In PowerShell, run `$env:MONGODB_TEST_URI='mongodb://127.0.0.1:27017/careerpilot_test'; npm test` to enable it. The integration test removes the one record it creates. Never point the test URI at a database containing data you need.

Latest observed test run: `npm test` completed with **5 passed, 0 failed, and 1 skipped**. The persistence test was skipped because `MONGODB_TEST_URI` was not configured for that run; it did not pass or verify persistence in that run.

## Analyzer scoring and limitations

The analyzer detects a small skill vocabulary and common aliases. Score = matched detected skills / all detected skills x 100, equally weighted. If no supported skill is found, no percentage is shown. Suggestions are rule-based. This is keyword-based scoring, not an AI model; it cannot assess proficiency, experience, or context, and its result is not a guarantee that a candidate is or is not suitable for a job.

The applications endpoint returns all saved records without pagination. This is acceptable for a small local portfolio demo, but may increase response size and database work as the collection grows.

## Security and data scope

CareerPilot currently has no authentication or per-user data isolation. The API treats the database as one shared workspace, so anyone who can reach it may be able to read, change, or delete application records. Keep the app on localhost and do not expose it publicly with real personal data. Helmet, CORS, input validation, request-size limits, and analyzer rate limiting provide useful safeguards, but do not replace authentication or authorization.

## AI-assisted development and assessment tools

Codex assisted with these implementation tasks in this project:

- Implementing the Express/Mongoose API routes, request validation, and error handling.
- Building the deterministic skill vocabulary, match calculation, and rule-based suggestions.
- Creating the responsive React/Vite dashboard, application tracker, and analyzer interface.
- Writing analyzer, HTTP API, and optional MongoDB persistence tests.
- Drafting setup, testing, limitation, and project documentation.

The project owner should review and validate the implementation and be prepared to explain its architecture and scoring choices. CodeZero use is **unverified** from the available project history; this README does not claim it was used for development or assessment/review. No claim is made that every deployment configuration has been verified.

## Deployment note

This is a single-user portfolio project. Add authentication, authorization, per-user data isolation, and pagination before considering a public deployment.
