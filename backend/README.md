# MediFind Tanzania API

Spring Boot and PostgreSQL backend for medicines, pharmacy locations, inventory, pricing, and reservations.

## Requirements

- Java 17+
- Maven 3.9+
- Docker Desktop, or a local PostgreSQL 16 database

## Run locally

From this directory:

```powershell
docker compose up -d
mvn spring-boot:run
```

The API starts at `http://localhost:8080/api`.

Environment variables can override the database connection:

- `DB_URL` (default `jdbc:postgresql://localhost:5432/medifind_db`)
- `DB_USERNAME` (default `postgres`)
- `DB_PASSWORD` (required; set this to the local PostgreSQL password)
- `PORT` (default `8080`)

For local PowerShell development, configure the variables before starting Spring Boot:

```powershell
$env:DB_URL = 'jdbc:postgresql://localhost:5432/medifind_db'
$env:DB_USERNAME = 'postgres'
$env:DB_PASSWORD = 'your-local-postgres-password'
mvn spring-boot:run
```

Do not commit real database passwords to the repository. The Docker Compose password is only a local development value; change it through a secrets mechanism before using Docker outside local development.

## Endpoints

- `GET /api/medicines?query=paracetamol`
- `GET /api/pharmacies`
- `GET /api/pharmacies/{pharmacyId}`
- `GET /api/pharmacies/{pharmacyId}/inventory`
- `PUT /api/pharmacies/{pharmacyId}/inventory/{medicineId}`
- `POST /api/reservations`
- `GET /api/reservations/patient/{patientId}`
- `GET /api/reservations/pharmacy/{pharmacyId}`
- `PATCH /api/reservations/{reservationId}/status`

Example inventory update:

```json
{"quantity": 12, "price": 750}
```

Example reservation:

```json
{"patientId":"patient-1","patientName":"Amina Hassan","pharmacyId":"zanzibar-care-pharmacy","medicineId":"paracetamol-500mg","price":550}
```
