# MediFind Frontend

React + Vite frontend for the MediFind Tanzania platform.

## Run locally

```powershell
npm install
npm run dev
```

The frontend API base URL defaults to `http://localhost:8080/api` and can be overridden with `VITE_API_URL`.

For Vercel, leave the project root directory at the repository root (`.`). The root `vercel.json` installs dependencies from this directory, runs the frontend build, publishes `frontend/dist`, and rewrites client-side routes. Set `VITE_API_URL` to the deployed backend URL ending in `/api`.
