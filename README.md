# MediFind Tanzania

MediFind Tanzania is a medicine availability and pharmacy reservation platform.

Patients can search for medicines, view pharmacy availability, and make reservations. Pharmacy staff can manage inventory and process reservations for their assigned pharmacy.

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
└── frontend/
```

## Requirements

- Java 17
- PostgreSQL
- Node.js and npm
- Git

## Run Backend

```bash
cd ~/Medfind-project/backend
./mvnw spring-boot:run
```

Backend API: `http://localhost:8080/api`

## Run Frontend

```bash
cd ~/Medfind-project/frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Authentication

MediFind uses JWT authentication with three roles:

- PATIENT
- PHARMACY_STAFF
- ADMIN

Pharmacy staff are restricted to their assigned pharmacy.

## Main Features

- Medicine search
- Pharmacy availability
- Pharmacy inventory management
- Patient accounts
- Pharmacy staff accounts
- Pharmacy access control
- Pharmacy closure and reopening
- Medicine reservations
- Reservation status tracking

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
