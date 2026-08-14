# School Management App

[![.NET](https://img.shields.io/badge/.NET-10.0%20%2F%208.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Unit_Tests-28%20Passing-brightgreen?logo=xunit&logoColor=white)](backend/SchoolManagement.Tests)

A comprehensive role-based **School Management App**. The application streamlines the academic lifecycle across administrators, educators, and learners—providing assignment creation, draft/publishing workflows, PDF answer sheet uploads, in-browser document preview, and grading with teacher feedback.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Main Features](#-main-features)
  - [Admin Features](#1-administrator-portal)
  - [Teacher Features](#2-teacher-portal)
  - [Student Features](#3-student-portal)
  - [Storage & Infrastructure](#4-storage--infrastructure)
- [Technology Stack](#-technology-stack)
- [Demo Login Credentials](#-demo-login-credentials)
- [Project Architecture & Structure](#-project-architecture--structure)
- [Environment Configuration](#-environment-configuration)
- [Database Setup Instructions](#-database-setup-instructions)
- [Instructions for Running the Application](#-instructions-for-running-the-application)
  - [Running the Backend API](#1-running-the-backend-aspnet-core-web-api)
  - [Running the Frontend](#2-running-the-frontend-nextjs)
- [Instructions for Running Tests](#-instructions-for-running-tests)
- [Assumptions & Design Decisions](#-assumptions--design-decisions)
- [Known Limitations](#-known-limitations)

---

## 📖 Project Overview

The **School Management App** is an enterprise-ready web application facilitating role-governed workflows for schools, colleges, and training academies. 

It solves the end-to-end assignment workflow:
1. **Administrators** establish the institutional structure by creating classes, subjects, user accounts, and mapping teacher allocations and student enrollments.
2. **Teachers** author assignments for their assigned classes/subjects, manage draft and published states, inspect submitted student PDFs via an embedded reader, and award marks with qualitative feedback.
3. **Students** view active assignments across enrolled classes, upload single PDF answer sheets with client/server validation, preview their submissions, and track grades and remarks.

The backend is built with **ASP.NET Core Web API** following a **Modular Vertical Slice Architecture** backed by **PostgreSQL** (with Entity Framework Core Migrations) and **Cloudflare R2** object storage. The frontend is built with **Next.js 15 (App Router)**, **TypeScript**, and **TanStack Query v5** for optimistic caching and seamless UX.

---

## ✨ Main Features

### 1. Administrator Portal
- **User Management**: Full CRUD operations for `Admin`, `Teacher`, and `Student` accounts with email uniqueness validation and BCrypt password hashing.
- **Class & Course Management**: Create, edit, and manage classes and grade levels with roster statistics.
- **Subject Management**: Manage curriculum subjects and unique course codes (e.g., `MATH101`, `PHY201`).
- **Teacher Allocations**: Assign teachers to specific class and subject pairings.
- **Student Enrollments**: Enroll students into classes to grant access to corresponding coursework.
- **Institutional Oversight**: Global view of all assignments and student submissions across all classes and departments.
- **Analytics Dashboard**: Aggregated summary cards displaying total users, active classes, subjects, assignments, and schoolwide submission activity.

### 2. Teacher Portal
- **Assignment Lifecycle Management**: Create, update, soft-delete, draft, and publish assignments.
- **Subject & Class Scoping**: Teachers can only create assignments for classes and subjects allocated to them.
- **Assignment Parameters**: Configure assignment title, rich description, submission deadline (UTC), and maximum marks.
- **Submission Roster**: View submitted student answer sheets, submission dates, file sizes, and grading status (`Submitted`, `Graded`, `Returned`).
- **In-App PDF Preview & Download**: Instant inline PDF preview modal without leaving the page, plus direct file download capability.
- **Grading & Feedback Modal**: Award marks with server-side validation ($0 \le \text{Marks} \le \text{MaxMarks}$) and provide personalized feedback comments.
- **Teacher Dashboard**: Overview statistics of assigned classes, total assignments, and pending grading queue.

### 3. Student Portal
- **Enrolled Coursework View**: View enrolled classes, assigned teachers, and corresponding subjects.
- **Assignment Discovery**: Discover active, upcoming, and past assignments with real-time deadline status and instructions.
- **Drag-and-Drop PDF Uploader**: Custom uploader with client-side format validation (`application/pdf`) and size enforcement ($\le 10\text{ MB}$).
- **Resubmission Support**: Students can re-upload/update their answer script any time before the deadline expires.
- **Submission Document Preview**: Preview uploaded PDF submission directly in the browser or download a copy.
- **Grades & Feedback Viewer**: Instant visibility into awarded marks, percentage scores, submission status, and teacher remarks.
- **Student Dashboard**: Performance summary cards displaying total assignments, submitted tasks, and graded achievements.

### 4. Storage & Infrastructure
- **Cloudflare R2 Object Storage**: S3-compatible cloud storage for secure, scalable PDF storage.
- **Local Disk Fallback**: If Cloudflare R2 credentials are not provided, the API automatically stores files in the local filesystem (`backend/SchoolManagement.Api/StorageUploads/`) for frictionless offline development.
- **1-Click Quick-Fill Demo Buttons**: Pre-filled credentials on the login screen for instant role switching during review.

---

## 🛠️ Technology Stack

| **Layer** | **Technology** | **Description** |
| :--- | :--- | :--- |
| **Backend Framework** | **ASP.NET Core 8.0 / .NET 10.0** | High-performance C# RESTful Web API |
| **Backend Architecture** | **Modular Vertical Slice** | Domain-organized modules (`Auth`, `Users`, `Classes`, `Subjects`, `Allocations`, `Assignments`, `Submissions`, `Overview`) |
| **Authentication & Auth** | **JWT Bearer & Role Policies** | Token-based authentication with `Admin`, `Teacher`, `Student` authorization |
| **API Documentation** | **OpenAPI & Scalar Reference** | Modern interactive API reference via `Scalar.AspNetCore` with Bearer auth support |
| **ORM & Database** | **EF Core 8 / PostgreSQL (Npgsql)** | Relational database mapping with automated EF Core migrations and seeding |
| **Cloud Object Storage** | **Cloudflare R2 (AWSSDK.S3)** | S3-compatible PDF file storage with local disk fallback |
| **Backend Testing** | **xUnit & FluentAssertions** | 28 comprehensive unit tests covering auth, allocations, deadlines, file limits, and grading |
| **Frontend Framework** | **Next.js 15 (App Router, React 19)** | Server and client components with TypeScript |
| **Server State & Caching**| **TanStack Query v5 (`@tanstack/react-query`)** | Client caching, optimistic updates, and automatic cache invalidation |
| **Styling & UI Components**| **Tailwind CSS & Radix UI** | Modern responsive interface, modals, dropdowns, and data tables |
| **Icons & Notifications** | **Lucide React & Sonner** | Consistent iconography and toast notifications |
| **Containerization** | **Docker & Docker Compose** | Pre-configured container setup for PostgreSQL |

---

## 🔑 Demo Credentials

Working credentials for all three application roles (automatically seeded on first startup):

- **Admin Email**: `admin@school.com` &nbsp;|&nbsp; **Password**: `Admin@123`
- **Teacher Email**: `teacher@school.com` &nbsp;|&nbsp; **Password**: `Teacher@123`
- **Student Email**: `student@school.com` &nbsp;|&nbsp; **Password**: `Student@123`

### Role & Access Matrix

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@school.com` | `Admin@123` | Full access: Users, Classes, Subjects, Allocations, Schoolwide Assignments & Submissions |
| 👨‍🏫 **Teacher** | `teacher@school.com` | `Teacher@123` | Author assignments, Draft/Publish, Review submissions, In-app PDF preview, Grade & Feedback |
| 🎓 **Student** | `student@school.com` | `Student@123` | View assignments, Upload/Update PDF (<10MB), Preview submission, View marks & remarks |

> 💡 **Quick Login**: The frontend login page (`/login`) includes 1-click **Quick-Fill** buttons for Admin, Teacher, and Student to populate credentials instantly.

---

## 🌟 Optional Additions & Enhanced Capabilities

The project includes several architectural enhancements to provide a production-grade experience:

1. **Interactive OpenAPI & Scalar API Documentation**:
   - **Scalar API Reference**: [http://localhost:5000/scalar/v1](http://localhost:5000/scalar/v1)
   - **OpenAPI Schema (JSON)**: `http://localhost:5000/openapi/v1.json`
   - *Modern, high-performance interactive API documentation with integrated JWT Bearer Authorization header support for testing authenticated endpoints.*
2. **Containerized PostgreSQL Environment**:
   - Production-ready `docker-compose.yml` pre-configured to launch PostgreSQL 16 on port `5433`.
3. **Automated Migrations & Rich Seeder**:
   - Running the backend automatically applies all EF Core migrations via `MigrateAsync()` and seeds comprehensive demo data.
4. **Cloudflare R2 Storage + Local Storage Fallback**:
   - S3-compatible Cloudflare R2 integration for PDF storage with automatic fallback to local disk storage (`StorageUploads/`).
5. **Interactive In-Browser PDF Preview Modal & Download**:
   - Embedded PDF viewer enabling teachers and students to inspect submitted answer scripts directly in the app.
6. **1-Click Demo Login Quick-Fill**:
   - Instant credentials population on the login screen for testing each role.

---

## 📁 Project Architecture & Structure

```text
school-management-system/
├── docker-compose.yml                  # PostgreSQL 16 container definition (Port 5433:5432)
├── .env.example                        # Template for environment configuration variables
├── README.md                           # Comprehensive documentation & setup instructions
│
├── backend/                            # ASP.NET Core Web API Solution
│   ├── SchoolManagement.slnx          # Solution file
│   │
│   ├── SchoolManagement.Api/           # Web API Project
│   │   ├── appsettings.json           # Application configuration
│   │   ├── Program.cs                 # App bootstrap, middleware, DI, & CORS
│   │   │
│   │   ├── BuildingBlocks/            # Cross-cutting foundational services
│   │   │   ├── Auth/                  # JwtTokenGenerator, JwtOptions
│   │   │   └── Storage/               # IStorageService, CloudflareR2StorageService
│   │   │
│   │   ├── Infrastructure/            # Persistence layer
│   │   │   └── Data/                  # AppDbContext, DatabaseSeeder
│   │   │
│   │   └── Modules/                   # Vertical Slice Entity Modules
│   │       ├── Auth/                  # AuthController, DTOs, Login/Me endpoints
│   │       ├── Users/                 # AdminUsersController, User entity, DTOs
│   │       ├── Classes/               # AdminClassesController, Teacher/Student controllers
│   │       ├── Subjects/              # AdminSubjectsController, Subject entity
│   │       ├── Allocations/           # AdminAllocationsController, ClassSubjectTeacher, ClassStudent
│   │       ├── Assignments/           # TeacherAssignmentsController, AdminAssignmentsController
│   │       ├── Submissions/           # StudentSubmissionsController, TeacherGradingController
│   │       └── Overview/              # AdminOverviewController, Teacher & Student stats
│   │
│   └── SchoolManagement.Tests/         # xUnit Unit Testing Suite (22 Tests)
│       ├── Auth/                      # AuthTests.cs (Login, JWT claims, 401 handling)
│       ├── Assignments/               # TeacherAssignmentTests.cs, SoftDeleteAndConstraintsTests.cs
│       └── Submissions/               # SubmissionWorkflowTests.cs, StudentPortalWorkflowTests.cs
│
└── frontend/                           # Next.js 15 TypeScript Application
    ├── package.json                    # Dependencies & scripts
    ├── next.config.ts                  # Next.js configuration
    ├── tailwind.config.ts              # Tailwind CSS design system configuration
    │
    └── src/
        ├── app/                        # Next.js App Router
        │   ├── layout.tsx              # Root HTML & Providers layout
        │   ├── globals.css             # Global styling & CSS custom properties
        │   ├── providers.tsx           # TanStack Query Client Provider
        │   ├── login/                  # Authentication page with Quick-Fill buttons
        │   ├── admin/dashboard/        # Admin Management Portal (Users, Classes, Subjects, Allocations)
        │   ├── teacher/                # Teacher Portal (Dashboard, Assignments, Classes)
        │   └── student/                # Student Portal (Dashboard, Assignments, Classes)
        │
        ├── components/                 # Reusable UI & Feature Components
        │   ├── admin/                  # OverviewTab, UserDirectoryTab, ClassDirectoryTab, AllocationManagerTab
        │   ├── teacher/                # TeacherOverviewTab, TeacherAssignmentsTab, GradingModal
        │   ├── student/                # StudentOverviewTab, StudentAssignmentsTab, StudentGradesTab
        │   ├── pdf/                    # PdfUploader (Drag & Drop), PdfPreviewModal, PdfPreviewGradingModal
        │   ├── layout/                 # Navbar, ProtectedRoute guard
        │   └── ui/                     # Radix & Tailwind design primitives (Dialog, Tabs, Select, etc.)
        │
        ├── context/                    # React Context
        │   └── AuthContext.tsx         # JWT token management & session state
        │
        └── lib/                        # Utilities & API Clients
            ├── api-client.ts           # Axios instance with JWT Authorization interceptor
            └── utils.ts                # Tailwind class merge & helper utilities
```

---

## ⚙️ Environment Configuration

The repository includes a template file `.env.example` demonstrating all configurable environment variables.

To customize settings, you can define environment variables or update `backend/SchoolManagement.Api/appsettings.json`:

```properties
# Database Configuration (PostgreSQL)
ConnectionStrings__DefaultConnection=Host=localhost;Port=5433;Database=school_management_db;Username=postgres;Password=postgrespassword

# JWT Authentication
Jwt__SecretKey=SuperSecretKeyForAssignmentAndSubmissionManagementSystem2026!
Jwt__Issuer=SchoolManagementApi
Jwt__Audience=SchoolManagementApp
Jwt__ExpiryMinutes=1440

# Cloudflare R2 Cloud Storage (Optional - falls back to local storage if omitted)
CloudflareR2__ServiceUrl=https://<account_id>.r2.cloudflarestorage.com
CloudflareR2__AccessKeyId=your_cloudflare_r2_access_key_id
CloudflareR2__SecretAccessKey=your_cloudflare_r2_secret_access_key
CloudflareR2__BucketName=school-assignment-submissions
CloudflareR2__PublicDomain=https://pub-<hash>.r2.dev

# Frontend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

> 🔒 **Security Best Practice**: No sensitive production credentials or API keys are committed to the repository.

---

## 🗄️ Database Setup Instructions

### Option 1: Docker Compose (Recommended)
A pre-configured `docker-compose.yml` is provided at the root of `school-management-system/`. Run:
```bash
# Start PostgreSQL container on port 5433
docker-compose up -d
```

### Option 2: Local PostgreSQL Instance
If you have PostgreSQL installed locally on your machine:
1. Create a database named `school_management_db`.
2. Update the connection string in `backend/SchoolManagement.Api/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=school_management_db;Username=postgres;Password=yourpassword"
   }
   ```

### Applying Migrations & Seeding Data
- **Automatic (Default)**: Running the backend API (`dotnet run`) automatically applies all pending EF Core migrations (`MigrateAsync()`) and populates rich seed data on startup.
- **Manual EF Core CLI (Optional)**: If you prefer applying migrations manually via the command line:
  ```bash
  # Ensure the dotnet-ef tool is installed
  dotnet tool install --global dotnet-ef

  # Apply migrations
  cd backend/SchoolManagement.Api
  dotnet ef database update
  ```

---

## 🚀 Instructions for Running the Application

### Prerequisites
- **.NET SDK 8.0 or .NET 10.0+** ([Download .NET](https://dotnet.microsoft.com/download))
- **Node.js v18.0+ & npm v9.0+** ([Download Node.js](https://nodejs.org/))
- **Docker** (Optional, for running PostgreSQL via Docker Compose)

---

### 1. Running the Backend (ASP.NET Core Web API)

1. Open a terminal and navigate to the API directory:
   ```bash
   cd backend/SchoolManagement.Api
   ```

2. Restore packages and run the API:
   ```bash
   dotnet run
   ```

3. The API will start and listen on:
   - **API Endpoint**: `http://localhost:5000`
   - **Interactive Scalar API Reference**: [http://localhost:5000/scalar/v1](http://localhost:5000/scalar/v1)
   - **OpenAPI Schema (JSON)**: [http://localhost:5000/openapi/v1.json](http://localhost:5000/openapi/v1.json)

---

### 2. Running the Frontend (Next.js)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Application URL**: `http://localhost:3000`
   - Use the **Quick-Fill** buttons on `/login` to sign in as **Admin**, **Teacher**, or **Student**.

---

## 🧪 Instructions for Running Tests

The solution includes an **xUnit Unit Test Suite** located in `backend/SchoolManagement.Tests/` covering core domain logic, security rules, and submission workflows.

### 1. Execute Backend Unit Tests
Navigate to the backend directory and run:
```bash
cd backend
dotnet test
```

### Test Suite Coverage (28 / 28 Tests Passing):
- **Authentication & Authorization (`Auth/AuthTests.cs`)**:
  - Validates JWT generation and claims for `Admin`, `Teacher`, and `Student`.
  - Rejects invalid credentials with `401 Unauthorized`.
- **Teacher Assignment Workflows (`Assignments/TeacherAssignmentTests.cs`)**:
  - Enforces teacher assignment allocation rules (teachers can only author assignments for assigned classes/subjects).
  - Validates draft vs. published visibility.
- **Data Integrity & Constraints (`Assignments/SoftDeleteAndConstraintsTests.cs`)**:
  - Validates soft deletion constraints, preserving historical submission records.
- **Submission & File Validation (`Submissions/SubmissionWorkflowTests.cs`)**:
  - Rejects non-PDF file formats with `400 Bad Request`.
  - Rejects files exceeding the 10 MB limit with `400 Bad Request`.
  - Enforces deadline rules (blocks late submissions).
  - Validates grading limits (rejects awarded marks exceeding maximum marks or below 0).
- **Student Portal Workflows (`Submissions/StudentPortalWorkflowTests.cs`)**:
  - Validates student enrollment scoping and resubmission replacement workflows before deadline.
- **Validation & Edge Case Resilience (`Validation/ValidationAndResilienceTests.cs`)**:
  - Validates input boundaries, extreme payloads, assignment query filters, and storage URL builders.

### 2. Validate Frontend Build & TypeScript
Navigate to the frontend directory and run:
```bash
cd frontend
npm run build
```
*(Verifies zero TypeScript compilation errors and static page generation across all routes).*

---

## 📌 Assumptions & Design Decisions

The following assumptions and design decisions guide the system architecture:

1. **Teacher Assignment Scoping**:
   - Teachers can only create assignments for combinations of classes and subjects they have been officially assigned to by an Administrator in the Allocations matrix.
2. **Student Enrollment Scoping**:
   - Students can only view and submit assignments for classes in which they are officially enrolled by an Administrator.
3. **File Format & Size Constraints**:
   - To ensure document standardization and security, all assignment submissions are strictly restricted to `.pdf` format (`application/pdf`) with a maximum allowable size of 10 MB (10,485,760 bytes).
4. **Resubmission Window**:
   - Students are permitted to update/re-submit their answer script as many times as necessary prior to the assignment deadline. The newest submission replaces the existing file. Once the deadline passes, submissions are strictly locked.
5. **Grading Rules**:
   - Teachers cannot assign negative marks or marks greater than the assignment's defined `MaxMarks`. Submissions transition through status states: `Submitted` $\rightarrow$ `Graded` $\rightarrow$ `Returned`.
6. **Graceful Storage Fallback**:
   - When Cloudflare R2 credentials are not configured, the storage service seamlessly writes files to the local disk (`StorageUploads/`), guaranteeing full functionality in offline or local evaluation environments without requiring third-party cloud accounts.
7. **Automated Migrations & Rich Seeder**:
   - On application startup, EF Core automatically applies all migration files and seeds a rich, relational demo dataset for immediate end-to-end evaluation.
8. **Client-Side Caching with TanStack Query**:
   - Used TanStack Query v5 to provide responsive, optimistic UI interactions, background synchronization, and automatic cache invalidation upon create/update actions.

---

## ⚠️ Known Limitations

1. **Real-Time Push Notifications**:
   - The application does not implement WebSockets / SignalR for instant push alerts; data synchronization is managed via TanStack Query's invalidation and refetching mechanisms.
2. **Single-File Submissions**:
   - Submissions currently accept a single `.pdf` document per assignment; multi-file attachments or zip archives are not supported.
3. **Cloudflare R2 Direct URLs**:
   - Direct public CDN downloads for R2 require setting `CloudflareR2__PublicDomain`; when using local storage fallback, files are served directly via API streaming endpoints.
