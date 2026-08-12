# Assignment & Submission Management System

A role-based school/college Assignment and Submission Management System built for **OnnoRokom Projukti Limited**.

---

## 🚀 Tech Stack

### **Backend (`/backend`)**
- **Framework**: ASP.NET Core 8.0 Web API (C#)
- **Architecture Pattern**: **Modular Entity Pattern** (`Modules/Auth`, `Modules/Users`, `Modules/Classes`, `Modules/Subjects`, `Modules/Allocations`, `Modules/Assignments`, `Modules/Submissions`)
- **Database**: PostgreSQL (Entity Framework Core 8) with In-Memory fallback for local dev
- **Storage Service**: Cloudflare R2 Storage (S3-Compatible API) for PDF document storage (10MB max, `.pdf` format only)
- **Authentication**: JWT Bearer Authentication & Role-Based Authorization (`Admin`, `Teacher`, `Student`)
- **Testing**: xUnit Unit Testing suite covering authorization, file validation, deadline enforcement, and grading limits

### **Frontend (`/frontend`)**
- **Framework**: Next.js 15 (React 19, TypeScript)
- **State Management & Caching**: **TanStack Query v5** (`@tanstack/react-query`) for API fetching, caching, and cache invalidation
- **Styling**: Tailwind CSS & Lucide Icons
- **Key Features**:
  - **PDF Preview**: "Click to Preview" modal using embedded PDF viewer
  - **Download PDF**: Direct download functionality for teacher and student answer files
  - **PDF File Uploader**: Drag-and-Drop uploader with client-side 10MB limit and `.pdf` mime-type validation
  - **Demo Credentials Quick-Fill**: 1-click login for Admin, Teacher, and Student roles

---

## 🔑 Demo Login Credentials

On first run, the database is automatically seeded with the following working demo accounts:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@school.com` | `Admin@123` | Manage Users, Classes, Subjects, Teacher allocations, Student enrollments |
| **Teacher** | `teacher@school.com` | `Teacher@123` | Create/edit assignments, Draft/Publish toggle, View student submissions, Preview & Download PDFs, Grade submissions |
| **Student** | `student@school.com` | `Student@123` | View enrolled assignments, PDF upload (<10MB, .pdf only), Preview own submission, Download PDF, View marks & feedback |

---

## 🛠️ Quick Local Setup Instructions

### Prerequisites
- **.NET SDK 8.0 / 10.0+**
- **Node.js v18+ & npm**
- **Docker & Docker Compose** (Optional for PostgreSQL)

### 1. Database Setup (PostgreSQL)
Run the PostgreSQL container via Docker Compose:
```bash
docker-compose up -d
```

*Note: If PostgreSQL is not running locally, the backend automatically falls back to an In-Memory database so you can test immediately without any database setup!*

---

### 2. Running the Backend API

```bash
cd backend/SchoolManagement.Api
dotnet run
```
- API will run at `http://localhost:5000` (or `https://localhost:5001`).
- The database automatically migrates and seeds demo data on startup.

#### Running Backend Unit Tests:
```bash
cd backend
dotnet test --no-restore
```

---

### 3. Running the Frontend (Next.js)

```bash
cd frontend
npm run dev
```
- Open `http://localhost:3000` in your browser.
- Use the quick-fill buttons on the login page to log in as **Admin**, **Teacher**, or **Student**.

---

## 📁 Project Architecture & Folder Structure

```text
school-management-system/
├── docker-compose.yml           # PostgreSQL container setup
├── .env.example                 # Environment variables template
├── README.md                    # Project documentation
│
├── backend/                     # ASP.NET Core 8 Web API
│   ├── SchoolManagement.Api/
│   │   ├── BuildingBlocks/
│   │   │   ├── Auth/            # JWT Token Generator & Claims
│   │   │   └── Storage/         # Cloudflare R2 Storage Service
│   │   ├── Modules/             # Vertical Slice Entity Modules
│   │   │   ├── Auth/
│   │   │   ├── Users/
│   │   │   ├── Classes/
│   │   │   ├── Subjects/
│   │   │   ├── Allocations/
│   │   │   ├── Assignments/
│   │   │   └── Submissions/
│   │   └── Infrastructure/
│   │       └── Data/            # AppDbContext & DatabaseSeeder
│   └── SchoolManagement.Tests/  # xUnit Test Suite
│
└── frontend/                    # Next.js TypeScript App
    ├── src/
    │   ├── app/
    │   │   ├── admin/dashboard/ # Admin Portal
    │   │   ├── teacher/dashboard/# Teacher Portal
    │   │   ├── student/dashboard/# Student Portal
    │   │   └── login/           # Login Page
    │   ├── components/
    │   │   ├── layout/          # Navbar & ProtectedRoute
    │   │   ├── pdf/             # PdfPreviewModal & PdfUploader
    │   │   └── teacher/         # GradingModal
    │   ├── context/             # AuthContext
    │   └── lib/                 # Axios API Client
    └── package.json
```

---

## ☁️ Cloudflare R2 Storage Configuration

To configure production Cloudflare R2 storage credentials, add the following keys to your backend `appsettings.json` or `.env`:

```json
"CloudflareR2": {
  "ServiceUrl": "https://<account_id>.r2.cloudflarestorage.com",
  "AccessKeyId": "YOUR_R2_ACCESS_KEY_ID",
  "SecretAccessKey": "YOUR_R2_SECRET_ACCESS_KEY",
  "BucketName": "school-assignment-submissions"
}
```
*If Cloudflare R2 keys are omitted, the storage service gracefully falls back to local disk storage (`backend/SchoolManagement.Api/StorageUploads/`) for seamless local development.*
