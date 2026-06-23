/**
 * Activity log type constants.
 * Format: "<resource>:<action>"
 * These are plain string constants — no DB enum is used.
 */
export const ACTIVITY_TYPES = {
    // ── User management ────────────────────────────────────────────────────────
    USER_CREATED:              "user:created",
    USER_UPDATED:              "user:updated",
    USER_DELETED:              "user:deleted",
    USER_TOGGLED:              "user:toggled",
    USER_LOGIN:                "user:login",
    USER_LOGOUT:               "user:logout",
    USER_PASSWORD_RESET:       "user:password_reset",

    // ── Patient management ─────────────────────────────────────────────────────
    PATIENT_CREATED:           "patient:created",
    PATIENT_UPDATED:           "patient:updated",
    PATIENT_DELETED:           "patient:deleted",

    // ── Visits ─────────────────────────────────────────────────────────────────
    VISIT_CREATED:             "visit:created",
    VISIT_CHECKED_OUT:         "visit:checked_out",

    // ── Admissions ─────────────────────────────────────────────────────────────
    ADMISSION_CREATED:         "admission:created",
    ADMISSION_UPDATED:         "admission:updated",
    ADMISSION_DISCHARGED:      "admission:discharged",
    ADMISSION_DELETED:         "admission:deleted",

    // ── Lab tests ──────────────────────────────────────────────────────────────
    LAB_TEST_CREATED:          "lab_test:created",
    LAB_TEST_UPDATED:          "lab_test:updated",
    LAB_TEST_DELETED:          "lab_test:deleted",

    // ── Diagnoses ──────────────────────────────────────────────────────────────
    DIAGNOSIS_CREATED:         "diagnosis:created",
    DIAGNOSIS_UPDATED:         "diagnosis:updated",
    DIAGNOSIS_DELETED:         "diagnosis:deleted",

    // ── Prescriptions ──────────────────────────────────────────────────────────
    PRESCRIPTION_CREATED:      "prescription:created",
    PRESCRIPTION_UPDATED:      "prescription:updated",
    PRESCRIPTION_DELETED:      "prescription:deleted",

    // ── Billing ────────────────────────────────────────────────────────────────
    BILL_CREATED:              "bill:created",
    BILL_UPDATED:              "bill:updated",
    BILL_DELETED:              "bill:deleted",
    PAYMENT_RECORDED:          "payment:recorded",

    // ── Appointments ───────────────────────────────────────────────────────────
    APPOINTMENT_CREATED:       "appointment:created",
    APPOINTMENT_UPDATED:       "appointment:updated",
    APPOINTMENT_DELETED:       "appointment:deleted",

    // ── Vital signs ────────────────────────────────────────────────────────────
    VITAL_SIGNS_RECORDED:      "vital_signs:recorded",
    VITAL_SIGNS_UPDATED:       "vital_signs:updated",

    // ── Notes ──────────────────────────────────────────────────────────────────
    DOCTOR_NOTE_CREATED:       "doctor_note:created",
    DOCTOR_NOTE_UPDATED:       "doctor_note:updated",
    NURSE_NOTE_CREATED:        "nurse_note:created",
    NURSE_NOTE_UPDATED:        "nurse_note:updated",

    // ── Settings ───────────────────────────────────────────────────────────────
    SETTINGS_UPDATED:          "settings:updated",

    // ── Beds ───────────────────────────────────────────────────────────────────
    BED_CREATED:               "bed:created",
    BED_UPDATED:               "bed:updated",
    BED_DELETED:               "bed:deleted",
};

/** Set of all valid activity type values for quick validation */
export const ACTIVITY_TYPE_VALUES = new Set(Object.values(ACTIVITY_TYPES));
