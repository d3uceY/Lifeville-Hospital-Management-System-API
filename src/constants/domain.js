// ─── User roles ───────────────────────────────────────────────────────────────
export const ROLES = {
  SUPERADMIN:   "superadmin",
  DOCTOR:       "doctor",
  NURSE:        "nurse",
  RECEPTIONIST: "receptionist",
  LAB:          "lab",
  ACCOUNTANT:   "accountant",
};

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
};

// ─── Billing / service categories ────────────────────────────────────────────
export const SERVICE_CATEGORIES = {
  CONSULTATION: "consultation",
  LAB:          "lab",
  DRUG:         "drug",
  DAILY_CHARGE: "daily_charge",
  SERVICE:      "service",
  WARD:         "ward",
  FOOD:         "food",
};

// ─── Billing types ────────────────────────────────────────────────────────────
export const BILLING_TYPES = {
  CREDIT:   "credit",
  PAY_NOW:  "pay_now",
};
