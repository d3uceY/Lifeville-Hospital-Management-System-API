# Lifeville HMS — API

The backend REST API and WebSocket server for [Lifeville HMS](../LHMS), a Hospital Management System built for clinical environments.

---

## Overview

Built on Node.js with ES Modules, Express, Drizzle ORM, and PostgreSQL. Provides all data endpoints consumed by the React frontend, plus real-time event delivery via Socket.IO and AI-powered clinical documentation features via the Groq API.

---

## Features

### Patient Management
- Full CRUD for patient records including demographics, medical history, allergies, drug history, family history, and social history
- Patient search with pagination

### Appointments
- Create, update, delete, and list appointments
- Filters by date range and status

### Inpatient Admissions
- Admit and discharge patients
- Track ward/bed assignment, consultant doctor, symptoms, and notes
- Discharge summary stored separately with final ICD-10-CM diagnosis, treatment given, outcome, and follow-up

### Vital Signs
- Record and retrieve per-patient vital signs (temperature, blood pressure, pulse, SpO₂, weight, height)

### Diagnoses
- Diagnoses stored with ICD-10-CM codes (the `condition` field stores the code; descriptions are resolved at query time via the in-memory ICD map)

### ICD-10-CM
- Full ICD-10-CM April 2026 code list loaded into memory at server start from a flat text file
- O(1) lookup by code via a `Map`
- Searchable via `GET /api/icd?q=` (max 20 results, authenticated)
- Exact lookup via `GET /api/icd/:code` (authenticated)
- Used to enrich discharge summaries and diagnoses in AI context

### Lab Test Investigations
- Create and manage lab test orders per patient, linked to admissions or outpatient visits
- Status workflow: To Do → In Progress → Done / Failed
- Results, comments, and image attachments (stored via Multer)
- Paginated list view with search

### Physical Examinations
- System-by-system examination records (General Appearance, HEENT, Cardiovascular, Respiration, Gastrointestinal, Genitourinary, Gynecology/Obstetrics, Musculoskeletal, Neurological, Skin, Findings)

### Complaints
- Record and retrieve patient complaints per visit

### Doctor's Notes & Nurse's Notes
- Create, list, and delete clinical notes per patient

### Prescriptions
- Multi-item prescriptions with drug name, dosage, frequency, duration, and instructions
- Status tracking (Active, Completed, Cancelled)

### Procedures
- Record clinical procedures performed per patient

### Billing
- Patient invoices with line items (description, quantity, unit price)
- Invoice status: Pending, Partial, Paid, Cancelled
- Billing linked to admissions or outpatient visits

### Inventory
- Stock management for hospital supplies and medications

### User Management & Auth
- JWT-based authentication
- Role-based access: `superadmin`, `doctor`, `nurse`, `lab`, `pharmacist`, `receptionist`
- Password hashing with bcrypt

### Hospital Settings
- Configurable system settings: hospital name, address, contact, license number, currency, ID prefixes, print footer

### Real-Time (Socket.IO)
- Live event emission for appointments and notifications
- Frontend subscribes to relevant channels on connection

---

## AI Features (Groq API)

All AI endpoints are rate-limited and require authentication.

| Endpoint | Description |
|---|---|
| `POST /api/ai/polish/complaint` | Rewrites an informal patient complaint into formal chief complaint language |
| `POST /api/ai/polish/doctor-note` | Rewrites a rough physician note into a structured SOAP-style clinical note |
| `POST /api/ai/polish/nurse-note` | Rewrites a rough nursing observation into professional nursing note language |
| `POST /api/ai/polish/lab-test-result` | Rewrites rough lab result text into structured, professional lab report language |
| `POST /api/ai/generate/physical-exam-findings` | Analyses system-by-system exam findings and generates: Key Findings, Provisional Diagnosis (with ICD-10-CM), Differentials (with ICD-10-CM), and Suggested Workup |
| `POST /api/ai/generate/lab-test-comment` | Generates a directed lab instruction for a requested test based on the patient's latest physical examination findings; acknowledges staleness if exam is >7 days old |
| `GET /api/ai/patient-summary/:patientId` | Generates a comprehensive AI clinical patient summary from all available EMR data (vitals, diagnoses, notes, labs, prescriptions, admissions, discharge summaries, etc.); server-cached for 10 minutes per patient |
| `GET /api/ai/patient-summary/:patientId/cached` | Returns the cached summary if available, without triggering a new generation |

Models used (Groq):
- `llama-3.3-70b-versatile` — summaries and polish tasks
- `llama-4-scout-17b` — autocomplete tasks
- `qwen/qwen3-32b` — structured JSON tasks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ (ES Modules) |
| Framework | Express |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Real-time | Socket.IO |
| AI | Groq API (`@ai-sdk/groq`, `ai`) |
| Auth | JWT + bcrypt |
| File Uploads | Multer |
| Rate Limiting | express-rate-limit |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

```bash
cd LHMS-API
npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/lifeville
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

### Database Setup

```bash
# Run migrations
node migrate.js
```

### Running

```bash
npm run dev
```

Server starts on `http://localhost:3000`.

---

## Project Structure

```
src/
  index.js              # Entry point — loads ICD data, starts server
  routes/               # Express routers
  controllers/          # Request handlers
  services/             # Business logic and DB queries
  middleware/           # Auth, rate limiting, error handling
  ai/
    controllers/        # AI endpoint handlers
    services/           # generateText wrappers (Groq)
    prompts/            # polishConfig — system prompts and prompt builders
  icd/
    services/           # ICD-10-CM loader, search, and lookup
    data/               # icd10cm_codes.txt flat file
drizzle/
  migrations/
    schema.js           # Drizzle table definitions
```

---

## License

MIT
