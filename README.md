# StaffSync – Modern Human Resource Management System (HRMS)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-RTK-purple.svg)](https://redux-toolkit.js.org/)

StaffSync is an enterprise-grade, responsive, full-stack Human Resource Management System (HRMS) built using the **MERN stack** (MongoDB, Express.js, React.js with Vite, and Node.js). It delivers seamless role-based workflows for **HR Administrators**, **Department Managers**, and **Staff Employees**, enforcing strict authorization, server-validated workflows, real-time analytics, and clean UI/UX with light/dark theme support.

---

## 1. Technology Stack

- **Frontend**:
  - React 18 with Vite
  - React Router v7 (`react-router-dom`) with route lazy loading (`React.lazy` + `Suspense`)
  - Redux Toolkit (`@reduxjs/toolkit` and `react-redux`) for authentication, notifications, and theme state
  - Axios for typed REST API communication with request/response interceptors
  - Bootstrap 5 & Custom CSS with responsive breakpoints and Dark/Light mode tokens
  - Recharts for data visualizations (headcount breakdown, attendance trends)
  - Lucide React for consistent icons
- **Backend**:
  - Node.js & Express.js
  - RESTful JSON architecture with modular controllers, routes, and middleware
  - JWT Authentication (Bearer Header & Secure HttpOnly cookies)
  - `bcryptjs` password hashing with salt rounds
  - Security suite: `helmet`, `cors`, `express-rate-limit`, and centralized error handling
- **Database**:
  - MongoDB with Mongoose ORM
  - Built-in embedded in-memory MongoDB fallback (`mongodb-memory-server`) so tests, seed data, and development run with 0 external installation hurdles if a local daemon is not running.

---

## 2. Core Modules & Three User Roles

### 👑 1. HR Administrator
- **Executive Dashboard**: Company-wide active headcount, attendance rate, approved leaves today, department distribution charts, and recent activity audit log.
- **Employee Management**: Full CRUD on employee directory (Add, Edit, View, Deactivate/Activate), unique ID generation, department assignment, manager mapping, and CSV export.
- **Manage Managers**: View organizational leadership rosters, team headcounts, and reassign direct reports between managers.
- **Leave Administration**: Review company-wide leave applications, approve/reject with reviewer remarks, and maintain balance integrity.
- **Attendance Oversight**: Real-time daily attendance roster with date picker, department filtering, and CSV report export.
- **Announcements**: Broadcast company-wide or department-specific communications with priority tags and pin-to-top flags.
- **Training Catalog**: Create company training programs, assign entire departments or individuals, and track completion percentages.
- **Performance Appraisals**: Conduct quarterly appraisals, assign ratings across 5 key metrics, and record development goals.

### 👔 2. Engineering Manager
- **Team Dashboard**: View team size, team members checked in today, direct reports on leave, and pending leave approval queue.
- **Team Leave Approvals**: Review, approve, or reject leave requests strictly for direct reports (cross-team tampering prevented by server-side authorization).
- **Team Attendance Log**: Monitor check-in times, late arrivals, and total logged hours for direct reports.
- **Team Training Progress**: Assign team members to development programs and observe individual completion bars.
- **Team Performance Appraisals**: Submit reviews and feedback for direct reports without exposing unauthorized employee private information.

### 💼 3. Staff Employee
- **Personal Dashboard**: Live digital clock with server-synchronized Check-In and Check-Out actions (duplicate check-in prevention, late check-in detection, and half-day calculation).
- **Leave Self-Service**: Live leave balance counters (Casual, Sick, Earned, Unpaid), date range validation, overlapping request prevention, and ability to cancel eligible pending requests.
- **Training Progression**: Access assigned curriculums and update learning progress percentages (Not Started &rarr; In Progress &rarr; Completed).
- **Performance Insights**: View personal punctuality scores, training completion rates, and historical manager appraisal reviews.
- **Profile Customization**: Edit permitted personal details (phone, street address, emergency contact, bio) and securely change passwords.

---

## 3. Database Architecture & Collections

StaffSync uses normalized MongoDB collections designed with Mongoose:

1. **`User` / `Employee`**:
   - `employeeId` (unique, uppercase index), `firstName`, `lastName`, `email` (unique index), `password` (bcrypt hash, `select: false`), `role` (`HR`, `MANAGER`, `EMPLOYEE`), `department`, `designation`, `phone`, `manager` (ObjectId ref User), `joiningDate`, `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), `address`, `emergencyContact`, `bio`.
2. **`LeaveBalance`**:
   - `user` (ref User), `year` (Number), `casualLeave` (total/used), `sickLeave` (total/used), `earnedLeave` (total/used), `unpaidLeave` (used). Compound unique index `{ user: 1, year: 1 }`.
3. **`LeaveRequest`**:
   - `user` (ref User), `leaveType` (`CASUAL`, `SICK`, `EARNED`, `UNPAID`), `startDate`, `endDate`, `durationDays`, `reason`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`), `reviewedBy` (ref User), `reviewedAt`, `reviewComment`.
4. **`Attendance`**:
   - `user` (ref User), `date` (normalized midnight UTC), `checkIn`, `checkOut`, `totalHours`, `status` (`PRESENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, `ABSENT`), `notes`. Compound unique index `{ user: 1, date: 1 }`.
5. **`Announcement`**:
   - `title`, `content`, `author` (ref User), `targetAudience` (`ALL` or department), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), `isPinned` (Boolean).
6. **`TrainingProgram`**:
   - `title`, `description`, `instructor`, `category` (`TECHNICAL`, `COMPLIANCE`, `LEADERSHIP`, `ONBOARDING`, `SOFT_SKILLS`), `targetAudience`, `startDate`, `endDate`, `createdBy` (ref User).
7. **`TrainingEnrollment`**:
   - `trainingProgram` (ref TrainingProgram), `user` (ref User), `status` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), `progressPercent`, `completedAt`. Compound unique index `{ trainingProgram: 1, user: 1 }`.
8. **`PerformanceReview`**:
   - `employee` (ref User), `reviewer` (ref User), `reviewPeriod`, `ratings` (`technicalSkills`, `communication`, `punctuality`, `leadership`, `overallRating`), `goals`, `strengths`, `improvements`, `feedback`.
9. **`Notification`**:
   - `recipient` (ref User), `title`, `message`, `type` (`LEAVE`, `ATTENDANCE`, `ANNOUNCEMENT`, `TRAINING`, `SYSTEM`), `link`, `isRead` (Boolean).
10. **`AuditLog`**:
    - `action`, `performedBy` (ref User), `targetUser` (ref User), `details`, `ipAddress`, timestamps.

---

## 4. REST API Endpoint Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **POST** | `/api/auth/login` | Public | Authenticate user, set cookie, and return JWT |
| **POST** | `/api/auth/logout` | Public | Invalidate token cookie |
| **GET** | `/api/auth/me` | Authenticated | Retrieve current user profile |
| **PUT** | `/api/auth/update-password` | Authenticated | Update user password with verification |
| **PUT** | `/api/auth/update-profile` | Authenticated | Update personal address/contact/bio |
| **GET** | `/api/employees` | Authenticated | Search, filter, and paginate employee directory |
| **GET** | `/api/employees/managers` | HR, Manager | Retrieve list of eligible managers |
| **GET** | `/api/employees/managers/overview`| HR | Overview of managers and direct report headcounts |
| **PUT** | `/api/employees/reassign-manager` | HR | Reassign reporting line to another manager |
| **POST** | `/api/employees` | HR | Create new employee and initialize leave balances |
| **PUT** | `/api/employees/:id` | HR | Update employee designation, department, etc. |
| **PATCH** | `/api/employees/:id/status` | HR | Change employee status (`ACTIVE`, `INACTIVE`) |
| **GET** | `/api/leaves/balances` | Authenticated | Fetch current user's annual leave quotas |
| **POST** | `/api/leaves/apply` | Authenticated | Submit leave application with date validation |
| **GET** | `/api/leaves/my-leaves` | Authenticated | List personal leave request history |
| **PATCH** | `/api/leaves/:id/cancel` | Authenticated | Cancel personal pending leave request |
| **GET** | `/api/leaves` | HR, Manager | Filter and list leave approval queue |
| **PATCH** | `/api/leaves/:id/review` | HR, Manager | Approve or reject leave request |
| **GET** | `/api/attendance/today` | Authenticated | Fetch today's check-in/out record |
| **POST** | `/api/attendance/check-in` | Authenticated | Record check-in timestamp and late status |
| **POST** | `/api/attendance/check-out` | Authenticated | Record check-out timestamp & compute work hours |
| **GET** | `/api/attendance/my-history` | Authenticated | List monthly personal attendance records |
| **GET** | `/api/attendance` | HR, Manager | Filter company or team daily attendance logs |
| **GET** | `/api/attendance/summary` | Authenticated | Fetch daily attendance rates and status counts |
| **GET** | `/api/announcements` | Authenticated | View target-scoped announcements |
| **POST** | `/api/announcements` | HR, Manager | Publish new company or departmental announcement |
| **DELETE** | `/api/announcements/:id` | HR, Author | Remove announcement |
| **GET** | `/api/training` | Authenticated | Catalog of training programs and enrollment state |
| **POST** | `/api/training` | HR, Manager | Create a new training program |
| **POST** | `/api/training/:id/assign` | HR, Manager | Enroll employee(s) or entire department |
| **PATCH** | `/api/training/:id/progress` | Authenticated | Update learning progress and completion status |
| **GET** | `/api/performance/my-summary` | Authenticated | Fetch personal punctuality, training & review scores |
| **GET** | `/api/performance/team` | HR, Manager | View team members' performance metrics roster |
| **POST** | `/api/performance` | HR, Manager | Submit quarterly performance review |
| **GET** | `/api/notifications` | Authenticated | List user notifications with unread counter |
| **PATCH** | `/api/notifications/:id/read` | Authenticated | Mark notification as read |
| **PATCH** | `/api/notifications/mark-all-read`| Authenticated | Mark all notifications as read |
| **GET** | `/api/reports/dashboard-stats` | Authenticated | Aggregated role-tailored dashboard metrics |
| **GET** | `/api/reports/export/employees`| HR, Manager | Export employee directory to CSV |
| **GET** | `/api/reports/export/attendance`| HR, Manager | Export date-wise attendance records to CSV |
| **GET** | `/api/reports/export/leaves` | HR, Manager | Export leave request records to CSV |
| **GET** | `/api/health` | Public | System health check and uptime status |

---

## 5. Development Setup & Execution

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+ or v10+)
- Optional: MongoDB local server or MongoDB Atlas URI (StaffSync will automatically run an embedded in-memory MongoDB instance if local MongoDB is not running).

### Quick Setup Commands in VS Code Terminal

```bash
# 1. Clone or navigate to the project directory
cd c:\Users\User\FSP

# 2. Install all root, server, and client dependencies
npm run install:all

# 3. Seed demo accounts and initial data
npm run seed

# 4. Run automated test suite
npm test

# 5. Start development servers
# Terminal 1: Start Express Backend API (Port 5000)
npm run dev:server

# Terminal 2: Start React Vite Frontend (Port 5173)
npm run dev:client
```

Open your browser to:
- **Public Home Page**: `http://localhost:5173`
- **Login Portal**: `http://localhost:5173/login`
- **Backend API Health Check**: `http://localhost:5000/api/health`

---

## 6. Pre-Configured Demo Credentials

For testing and grading evaluation, StaffSync includes pre-seeded accounts. The login page also features **1-click quick login buttons**:

| Role | Account Email | Password | Key Responsibilities |
|---|---|---|---|
| **HR Administrator** | `hr@staffsync.com` | `StaffSync@2025` | Full administrative control, employee management, manage managers, company-wide leave reviews, CSV exports |
| **Engineering Manager** | `manager@staffsync.com` | `StaffSync@2025` | Direct report oversight, team leave approvals, team attendance calendar, training assignments |
| **Staff Employee 1** | `john.doe@staffsync.com` | `StaffSync@2025` | Engineering employee, checked in today, active leave balance |
| **Staff Employee 2** | `jane.smith@staffsync.com` | `StaffSync@2025` | Marketing employee, on approved sick leave today |
| **Staff Employee 3** | `alex.kumar@staffsync.com` | `StaffSync@2025` | Engineering employee, pending leave request awaiting manager approval |

---

## 7. Automated Testing Results

Run tests anytime with:
```bash
npm test
```

### Verified Test Summary:
- **Total Test Suites**: 9 suites
- **Total Tests Executed**: 31 tests
- **Tests Passed**: 31 ✅
- **Failures**: 0 ❌
- **Test execution breakdown**:
  - `Authentication Module`: Valid login, role assignment, password validation, protected `/me` token resolution.
  - `Role-Based Authorization`: Employee forbidden (403) from creating employees; HR authorized (201); manager access.
  - `Attendance Workflow`: Check-in recording, duplicate check-in prevention (400), check-out calculation, duplicate check-out prevention.
  - `Leave Management Workflow`: Quota balance checking, application date validation, overlapping date rejection (400), manager approval, automatic quota balance deduction, applicant cancellation.
  - `Announcements & Training`: HR company-wide broadcast, employee reading, program creation, progress updating.
  - `Manager Management`: HR overview of direct report counts, non-HR forbidden (403), employee reassignment to new manager.
  - `Performance Reviews`: Manager/HR appraisal creation, employee personal summary calculation, non-privileged rejection (403).
  - `System Health & Error Handling`: `/api/health` 200, structured 404 for non-existent routes.

---

## 8. Deployment Guide

### A. Environment Configuration (`server/.env`)
```ini
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-staffsync-app.com
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/staffsync?retryWrites=true&w=majority
JWT_SECRET=staffsync_super_secret_jwt_key_change_in_production_2025
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7
DEFAULT_TIMEZONE=Asia/Kolkata
```

### B. Production Build
```bash
# Build React Frontend for Production
cd client
npm run build
```
This generates optimized static chunks in `client/dist`.

### C. Unified Single-Service Deployment (Render / Railway / Heroku)
StaffSync is configured to automatically serve the compiled frontend (`client/dist`) from the Express backend when running in production:
```bash
# Start backend which serves both API and static frontend SPA
cd server
npm start
```
Any request that does not match `/api/*` will route to `client/dist/index.html` with client-side SPA routing supported.

### D. Separate Frontend Deployment (Vercel / Netlify)
If deploying the frontend independently on Vercel or Netlify:
1. Deploy `client/` folder.
2. Set build command: `npm run build`, output directory: `dist`.
3. Set environment variable: `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api`.
4. Add backend CORS origin in `server/.env`: `FRONTEND_URL=https://your-frontend.vercel.app`.

