# Medical Practice & Patient Management Mobile App

## Framework
React Mobile (Expo, TypeScript, Functional Components)

## Executive Summary

We need a multi-role medical management and patient engagement mobile application called **MediConnect Operations & Patient Portal**. Designed for patients (public/social security and private), doctors, and clinical support staff (nurses, secretaries), the mobile app unifies appointment scheduling, clinical triage priority queues, prescription tracking, multi-channel communication workflows, and OCR-assisted financial expense management into a cohesive mobile interface.

## App Shell & Visual Identity

### Visual Style

- Clean, high-contrast clinical theme with a background of `#F8FAFC` (light slate/white)
- Primary Accent: Deep Medical Blue (`#0284C7`)
- Secondary Accents: Emerald Green (`#10B981` for confirmed/paid status), Amber Gold (`#F59E0B` for priority/pending triage), and Rose Red (`#EF4444` for urgent/surgical alerts)
- Clean, modern typography with clear visual hierarchy
- Custom iconography for appointment types, pharmacy dispatches, and financial receipts

### Navigation Shell

- Role-adaptive Bottom Tab Navigation for core sections based on current profile (`PATIENT` vs `CLINICAL_STAFF` vs `DOCTOR` views)
- Top Safe Area Header displaying active user profile switcher (Patient / Doctor / Staff), location indicator, and pending notification badge
- Stack navigation for drill-down appointment details, prescription receipts, OCR scanner view, and schedule editor

### Layout Regions

The mobile application layout utilizes a vertical stack flexbox system with safe area bounds:

- Role Switcher & Profile Header Card
- Top-level priority summary metrics (Pending Confirmations, Urgent Triage Count, Monthly Expense Total)
- Segmented tab control (Social Security / Private Patients for staff; Upcoming / Past for patients)
- Priority-ranked vertical queue cards with triage score indicators
- Actionable communication action rows (Trigger WhatsApp, Prompt Doctor Call, Confirm Slot)
- Financial OCR photo scanner dropzone and manual entry form cards
- Sticky bottom action bar for primary screen workflows

### Accessibility & Mobile Spec

- Minimum 44x44pt touch targets for fast navigation by clinical staff on the floor
- High contrast WCAG AA compliant text and status badge indicators
- Screen reader support (`accessibilityLabel`, `accessibilityRole`, `accessibilityState`) on priority badges and appointment status cards
- Dynamic layout scaling using `useWindowDimensions` supporting phone and tablet form factors
- Native safe area handling via `SafeAreaView`

## Global Shell Requirements & Services

### 1. Core Services

- **Hospital ERP Ingestion & Triage Engine:** Ingests patient recommendation queues from the hospital ERP and calculates an automated priority score (0–10) based on severity and medical diagnosis.
- **Role & Access Control Service:** Manages user role sessions (`PATIENT_SOCIAL_SECURITY`, `PATIENT_PRIVATE`, `DOCTOR`, `NURSE`, `SECRETARY`) and enforces field-level access rights.
- **Omnichannel Messaging Gateway:** Coordinates automated WhatsApp template dispatches and tracks required manual follow-up calls by medical personnel.
- **Financial & OCR Invoice Service:** Processes photo uploads of paper receipts via mock OCR to extract vendor, tax ID, totals, and line items, maintaining monthly ledger balances.

### 2. Shared UI Components

- **Role Switcher Header:** Allows instant toggle between Patient Portal view and Clinical Staff / Doctor Management view for testing/mock purposes.
- **Priority Triage Badge:** Color-coded indicator displaying medical urgency rank (`URGENT`, `HIGH`, `MEDIUM`, `ROUTINE`) with raw numerical score.
- **Appointment Status Timeline:** Visual progress tracker showing states (`PENDING_TRIAGE`, `SCHEDULED`, `WHATSAPP_SENT`, `CALL_REQUIRED`, `CONFIRMED`, `IN_CONSULTATION`, `COMPLETED`).
- **Prescription & Pharmacy Status Card:** Dedicated item card showing medication name, dosage, issuing doctor, and real-time pharmacy dispatch status (`ISSUED`, `DISPATCHED_TO_PHARMACY`, `READY_FOR_PICKUP`).
- **OCR Scan Preview Component:** Camera viewfinder framing container with overlay bounding boxes showing extracted fields from receipt images.

---

## Features & UX Specifications

### 1. Clinical Agenda & Smart Triage Dashboard (`clinical_agenda`)

**Description:**

Central operational dashboard for doctors, nurses, and secretaries. Displays ERP-recommended patients prioritized by severity, manages doctor availability slots, and distinguishes between general consultations and surgical procedures.

**UX Spec:**

- **Views:** Vertical priority list, calendar day/week view, appointment modifier modal
- **States:** `loading` | `empty` | `error` | `success`
- **Feedback:** Toast alert on new high-priority ERP patient ingestion; confirmation dialogs on schedule override
- **A11y:** Priority labels announced explicitly via screen readers (`accessibilityValue`)
- **Mobile UX:** Swipeable appointment cards for quick actions (Send WhatsApp, Require Call, Reschedule); pull-to-refresh for ERP queue sync

**Entities:**

- `Appointment`: `id: string`, `patientId: string`, `patientName: string`, `patientType: 'SOCIAL_SECURITY' | 'PRIVATE'`, `doctorId: string`, `appointmentType: 'CONSULTATION' | 'SURGICAL_PROCEDURE'`, `status: string`, `priorityScore: number`, `severityLevel: 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE'`, `scheduledTime: string`, `durationMinutes: number`
- `DoctorSchedule`: `doctorId: string`, `doctorName: string`, `availableSlots: string[]`, `blockedSlots: string[]`

**Actions:**

- Fetch priority-ranked queue from hospital ERP
- Assign available time slot based on priority score
- Modify appointment time or reassign doctor
- Switch view filter between consultations and surgical procedures

---

### 2. Patient Portal & Records Summary (`patient_portal`)

**Description:**

Patient-facing interface for self-service appointment requests, viewing appointment history, tracking active prescriptions, pharmacy dispatch notifications, specialist referrals, and lab test requests.

**UX Spec:**

- **Views:** Patient dashboard stack, prescription detail view, test order list
- **States:** `loading` | `empty` | `error` | `success`
- **Feedback:** Banner notifications for new prescriptions or referral requests
- **A11y:** High-contrast text, simplified screen layouts for elderly patients
- **Mobile UX:** Bottom tab navigation to quickly toggle between "My Appointments", "Prescriptions", and "Exams/Referrals"

**Entities:**

- `PatientRecord`: `id: string`, `fullName: string`, `insuranceType: 'SOCIAL_SECURITY' | 'PRIVATE'`, `insuranceNumber: string`
- `Prescription`: `id: string`, `patientId: string`, `medicationName: string`, `dosage: string`, `instructions: string`, `pharmacyStatus: 'PENDING' | 'SENT_TO_PHARMACY' | 'READY_FOR_PICKUP'`, `issuedAt: string`
- `MedicalOrder`: `id: string`, `patientId: string`, `orderType: 'SPECIALIST_REFERRAL' | 'LAB_EXAM'`, `description: string`, `targetSpecialty?: string`, `status: 'REQUESTED' | 'SCHEDULED' | 'COMPLETED'`

**Actions:**

- Request new appointment slot
- Fetch active prescriptions and pharmacy status
- View pending specialist referrals and lab exam requests
- Toggle reminder notifications (24h before / day of appointment)

---

### 3. Communication & Notification Dispatcher (`messaging_hub`)

**Description:**

Coordinates automated and manual outreach workflows. Automatically generates WhatsApp confirmation messages to patients and alerts doctors when a direct telephone call is required for high-priority or surgical appointments.

**UX Spec:**

- **Views:** Action item list for staff, call queue detail bar
- **States:** `idle` | `dispatching` | `sent` | `call_pending` | `call_completed`
- **Feedback:** Visual checkmarks when WhatsApp delivery completes; persistent badge for pending doctor calls
- **A11y:** Clear action button roles (`accessibilityRole="button"`)
- **Mobile UX:** One-tap action to launch native WhatsApp chat or trigger native phone dialer with pre-filled numbers

**Entities:**

- `NotificationLog`: `id: string`, `appointmentId: string`, `channel: 'WHATSAPP' | 'DOCTOR_CALL'`, `recipientPhone: string`, `messageTemplate: string`, `status: 'PENDING' | 'SENT' | 'FAILED' | 'CALL_REQUIRED' | 'CALL_COMPLETED'`, `timestamp: string`

**Actions:**

- Trigger automated WhatsApp notification
- Log doctor call execution status
- Resend failed delivery notifications

---

### 4. Practice Financials & Expense OCR Module (`financial_ledger`)

**Description:**

Financial management module for tracking monthly issued invoices and practice operating expenses. Allows staff to register costs manually or by snapping a photo of an invoice/receipt using mock OCR extraction.

**UX Spec:**

- **Views:** Financial summary dashboard, expense itemizer list, receipt camera/scanner view
- **States:** `loading` | `scanning_ocr` | `verified` | `saving` | `error`
- **Feedback:** Instant feedback highlighting fields extracted by OCR with editable fields for manual correction
- **A11y:** Readout of calculated monthly totals and tax breakdowns
- **Mobile UX:** Floating action button (FAB) to trigger camera scan; horizontal swipe to delete manual expense entries

**Entities:**

- `FinancialSummary`: `periodMonth: string`, `totalInvoicedAmount: number`, `totalExpensesAmount: number`, `netBalance: number`
- `ExpenseEntry`: `id: string`, `entryType: 'OCR_IMAGE' | 'MANUAL'`, `vendorName: string`, `invoiceNumber: string`, `amount: number`, `taxAmount: number`, `category: string`, `receiptImageUrl?: string`, `confidenceScore?: number`, `registeredAt: string`

**Actions:**

- Fetch monthly financial overview (issued invoices vs expenses)
- Process receipt image via mock OCR parser
- Save verified expense entry to accounting ledger
- Manually create or edit financial expense record