# MedFind Backend Setup Guide

## Prerequisites
- PostgreSQL 12+ installed on your system
- Node.js v14+ installed
- npm installed

## Step 1: Verify Node.js and npm Installation

```bash
node --version
npm --version
```

## Step 2: Install Dependencies (Already Done ✅)

The npm packages have been installed successfully. Key packages:
- **express**: Web framework for Node.js
- **pg**: PostgreSQL client for Node.js
- **dotenv**: Environment variable management
- **cors**: Cross-Origin Resource Sharing

## Step 3: PostgreSQL Setup

### Windows Setup:

1. **Download PostgreSQL**: Visit https://www.postgresql.org/download/windows/
2. **Run installer** and remember your password for the `postgres` user
3. **During installation**, keep these defaults:
   - Port: 5432
   - Username: postgres
   - Password: (set one and remember it)

4. **Verify Installation**:
   ```bash
   psql --version
   ```

### Step 4: Create the MedFind Database

1. **Open PostgreSQL Command Line** (pgAdmin or `psql`):

   Using `psql`:
   ```bash
   psql -U postgres
   ```
   
   Enter your PostgreSQL password when prompted.

2. **Create the database**:
   ```sql
   CREATE DATABASE medfind;
   ```

3. **Verify database creation**:
   ```sql
   \l
   ```
   You should see "medfind" in the list.

### Step 5: Initialize the Database Schema

1. **Connect to the medfind database**:
   ```bash
   psql -U postgres -d medfind -f "c:\Users\PC\OneDrive\Documents\Medfind project\init-db.sql"
   ```

   Or if you're already in psql:
   ```sql
   \c medfind
   \i 'c:/Users/PC/OneDrive/Documents/Medfind project/init-db.sql'
   ```

2. **Verify tables were created**:
   ```sql
   \dt
   ```
   You should see: medicine, pharmacy, inventory_item, reservation

## Step 6: Configure Environment Variables

The `.env` file has been created with the following configuration:

```
DB_USER=postgres
DB_PASSWORD=postgres          # Change this if you set a different password!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medfind
PORT=5000
NODE_ENV=development
```

**IMPORTANT**: Update `DB_PASSWORD` in `.env` if you set a different password during PostgreSQL installation!

## Step 7: Start the Backend Server

```bash
cd "c:\Users\PC\OneDrive\Documents\Medfind project"
node server.js
```

You should see:
```
Successfully connected to PostgreSQL database!
Server running on http://localhost:5000
```

## Step 8: Test the Server

Open your browser or use curl:

```bash
curl http://localhost:5000/api/test
```

Expected response:
```json
{
  "message": "MedFind Backend connected to PostgreSQL!",
  "timestamp": "2026-09-09T12:00:00.000Z"
}
```

## Troubleshooting

### Error: "Cannot find module 'pg'"
- Run: `npm install` in the project root directory

### Error: "FATAL: password authentication failed for user "postgres""
- Update the `DB_PASSWORD` in `.env` file to match your PostgreSQL password

### Error: "database "medfind" does not exist"
- Create the database using: `CREATE DATABASE medfind;`
- Run the initialization script

### Error: "could not connect to server: Connection refused"
- Ensure PostgreSQL is running (check Windows Services or start PostgreSQL)
- Verify `DB_HOST` and `DB_PORT` in `.env` are correct

### Error: "relation "medicine" does not exist"
- Run the database initialization script: `psql -U postgres -d medfind -f init-db.sql`

## Files Created/Modified

1. **`package.json`** - Node.js project configuration with dependencies
2. **`.env`** - Environment variables for database connection
3. **`server.js`** - Express server (path to db.js fixed)
4. **`backend/db.js`** - PostgreSQL connection pool (typo fixed)
5. **`init-db.sql`** - Database schema and sample data

## Development Workflow

1. Start PostgreSQL service
2. Start the Node.js server: `node server.js`
3. Access API at: `http://localhost:5000`
4. For development with auto-reload: `npm run dev` (after installing nodemon)

## Next Steps

- Connect the frontend to the backend API
- Implement authentication endpoints
- Add more API endpoints as needed
- Deploy to production environment

---

For more information about the MedFind API, check the backend controllers in `backend/src/main/java/tz/medifind/controller/`
