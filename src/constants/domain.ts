// ─── User roles ───────────────────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:   "superadmin",
  DOCTOR:       "doctor",
  NURSE:        "nurse",
  RECEPTIONIST: "receptionist",
  LAB:          "lab",
  ACCOUNTANT:   "accountant",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/** Human-readable labels — used to seed the roles table */
export const ROLE_LABELS = {
  superadmin:   "Super Admin",
  doctor:       "Doctor",
  nurse:        "Nurse",
  receptionist: "Receptionist",
  lab:          "Lab Technician",
  accountant:   "Accountant",
} as const;

// ─── Predefined role groups used in notifications ─────────────────────────────
export const NOTIFICATION_ROLES = {
  /** Appointment events */
  APPOINTMENT:   [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST],
  /** Clinical notes, diagnoses, complaints */
  CLINICAL:      [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.NURSE],
  /** Lab test events */
  LAB:           [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.LAB],
  /** Admissions / discharges */
  ADMISSION:     [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.NURSE],
  /** Vitals, physical exams */
  ALL_CLINICAL:  [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.LAB],
  /** Patient visits */
  VISIT:         [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.RECEPTIONIST, ROLES.LAB, ROLES.NURSE],
  /** Patient-level events — virtually all staff */
  ALL_STAFF:     [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.LAB, ROLES.RECEPTIONIST, ROLES.NURSE],
} as const;

// ─── Billing / service categories ────────────────────────────────────────────
export const SERVICE_CATEGORIES = {
  CONSULTATION: "consultation",
  LAB:          "lab",
  DRUG:         "drug",
  DAILY_CHARGE: "daily_charge",
  SERVICE:      "service",
  WARD:         "ward",
  FOOD:         "food",
} as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[keyof typeof SERVICE_CATEGORIES];

// ─── Billing types ────────────────────────────────────────────────────────────
export const BILLING_TYPES = {
  CREDIT:   "credit",
  PAY_NOW:  "pay_now",
} as const;

export type BillingType = typeof BILLING_TYPES[keyof typeof BILLING_TYPES];

// ─── Invoice statuses ──────────────────────────────────────────────
export const INVOICE_STATUSES = {
  OPEN:      "open",      // no payment made yet
  PARTIAL:   "partial",   // some payment made, balance remaining
  PAID:      "paid",      // fully settled
  OVERDUE:   "overdue",   // past due, unpaid
  CANCELLED: "cancelled",
} as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[keyof typeof INVOICE_STATUSES];

// ─── Cloudinary upload subfolders ────────────────────────────────────────────
export const UPLOAD_SUBFOLDERS = {
  LAB_DOCS:        "lab-test-docs",
  PATIENT_PROFILE: "patient-profiles",
  USER_PROFILE:    "user-profiles",
} as const;