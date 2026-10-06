# MediFind Tanzania

MediFind Tanzania is a medicine availability and pharmacy reservation platform.

Patients can search for medicines, view their availability at pharmacies, and make reservations. Pharmacy staff can manage medicine inventory and process reservations for their assigned pharmacy.

## Main Features

- Medicine search
- Pharmacy availability
- Pharmacy locations
- Pharmacy inventory management
- Patient accounts
- Pharmacy staff accounts
- Admin account
- Pharmacy-specific access control
- Temporary pharmacy closure and reopening
- Medicine reservations
- Reservation status tracking
- JWT-based authentication

## Technology Stack

### Backend

- Java 17
- Spring Boot 3.4.4
- Spring Security
- JWT authentication
- Spring Data JPA
- PostgreSQL
- Maven

### Frontend

- React 19
- Vite
- React Router
- Axios

## Project Structure

```text
Medfind-project/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── mvnw
└── frontend/
    ├── src/
    ├── package.json
    └── vite.config.js
```

## Requirements

- Java 17
- PostgreSQL
- Node.js and npm
- Git

## Database Setup

MediFind uses PostgreSQL.

Default local database configuration:

```text
Database: medifind_db
Host: localhost
Port: 5432
Username: postgres
```

The database must exist before starting the backend.

Do not commit database passwords or other secrets to the repository.

## Run the Backend

```bash
cd ~/Medfind-project/backend
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`.

The API base URL is `http://localhost:8080/api`.

## Run the Frontend

In another terminal:

```bash
cd ~/Medfind-project/frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

The frontend communicates with the backend through the REST API.

The API URL can be overridden with the `VITE_API_URL` environment variable.

## Authentication

MediFind uses JWT authentication.

The system supports three main roles:

- `PATIENT`
- `PHARMACY_STAFF`
- `ADMIN`

Pharmacy staff are restricted to their assigned pharmacy.

Patients can create and view their own reservations.

## Reservations

The current reservation statuses are:

- `PENDING`
- `CONFIRMED`
- `READY_FOR_COLLECTION`
- `COLLECTED`
- `CANCELLED`
- `EXPIRED`

Normal flow:

```text
PENDING
   ↓
CONFIRMED
   ↓
READY_FOR_COLLECTION
   ↓
COLLECTED
```

Reservations can also be cancelled or expire when applicable.

The backend is the source of truth for reservation status and access control.

## Inventory

Inventory is managed separately for each pharmacy and medicine.

Pharmacy staff can update quantity and price.

Availability is derived by the backend:

```text
Quantity = 0       → OUT_OF_STOCK
Quantity 1–5       → LOW_STOCK
Quantity > 5       → AVAILABLE
```

Inventory access is restricted to the appropriate pharmacy staff or administrator.

## Pharmacy Closure

Authorized pharmacy staff or administrators can temporarily close a pharmacy and later reopen it.

When a pharmacy is closed, patients cannot create new reservations at that pharmacy.

The pharmacy open/closed state is controlled by the backend.

## API

The backend provides REST API endpoints for:

- Authentication
- Medicines
- Pharmacies
- Pharmacy inventory
- Reservations

API base URL: `http://localhost:8080/api`.

## Development Workflow

1. Start PostgreSQL.
2. Start the Spring Boot backend.
3. Start the React/Vite frontend.
4. Open the frontend in a browser.
5. Use the frontend according to the logged-in user role.

## Architecture

```text
React + Vite
      ↓
REST API
      ↓
Spring Boot
      ↓
PostgreSQL
```

The backend is responsible for authentication, authorization, inventory rules, pharmacy access control, reservations, and database persistence.
