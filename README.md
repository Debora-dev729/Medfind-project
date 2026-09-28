# MediFind Tanzania

MediFind helps patients find and reserve medicines from nearby pharmacies.

## Project Structure

```text
medfind project/
├── frontend/   React + Vite patient and pharmacy interface
└── backend/    Spring Boot + PostgreSQL API
```

The older `my-react-app/` directory is an untouched Vite starter and is not the active MediFind frontend.

## Run the frontend

```powershell
cd frontend
npm install
npm run dev
```

## Run the Node.js Backend Server

The new Node.js backend server provides REST API endpoints for the frontend.

### Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Setup PostgreSQL database**:
   ```bash
   npm run setup-db
   ```
   This will create the database, tables, and insert sample data.

3. **Start the server**:
   ```bash
   npm start
   ```
   Server runs at `http://localhost:5000`

4. **Test the connection**:
   ```bash
   curl http://localhost:5000/api/test
   ```

### Detailed Setup Guide

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for complete setup instructions including:
- PostgreSQL installation
- Environment configuration
- Database initialization
- API testing
- Troubleshooting

## Run the Java Backend (Alternative)

See [backend/README.md](backend/README.md) for Spring Boot, Maven, PostgreSQL, and Docker setup.

