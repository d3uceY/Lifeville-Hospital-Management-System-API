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
    PATIENT_VIEWED:            "patient:viewed",      // PHI access logged per HIPAA 

    // ── Visits ─────────────────────────────────────────────────────────────────
    VISIT_CREATED:             "visit:created",
    VISIT_CHECKED_OUT:         "visit:checked_out",
    VISIT_VIEWED:              "visit:viewed",      // PHI access logged per HIPAA
    ACTIVE_VISITS_VIEWED:      "active_visits:viewed",

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
    VITAL_SIGNS_DELETED:       "vital_signs:deleted",

    // ── Notes ──────────────────────────────────────────────────────────────────
    DOCTOR_NOTE_CREATED:       "doctor_note:created",
    DOCTOR_NOTE_UPDATED:       "doctor_note:updated",
    DOCTOR_NOTE_DELETED:       "doctor_note:deleted",
    NURSE_NOTE_CREATED:        "nurse_note:created",
    NURSE_NOTE_UPDATED:        "nurse_note:updated",
    NURSE_NOTE_DELETED:        "nurse_note:deleted",

    // ── Settings ───────────────────────────────────────────────────────────────
    SETTINGS_UPDATED:          "settings:updated",

    // ── Beds ───────────────────────────────────────────────────────────────────
    BED_CREATED:               "bed:created",
    BED_UPDATED:               "bed:updated",
    BED_DELETED:               "bed:deleted",

    // ── Insurance ──────────────────────────────────────────────────────────────
    INSURANCE_PROVIDER_CREATED: "insurance_provider:created",
    INSURANCE_PROVIDER_UPDATED: "insurance_provider:updated",
    INSURANCE_PROVIDER_DELETED: "insurance_provider:deleted",
    INSURANCE_PLAN_CREATED:     "insurance_plan:created",
    INSURANCE_PLAN_UPDATED:     "insurance_plan:updated",
    INSURANCE_PLAN_DELETED:     "insurance_plan:deleted",
    PATIENT_INSURANCE_CREATED:  "patient_insurance:created",
    PATIENT_INSURANCE_UPDATED:  "patient_insurance:updated",
    PATIENT_INSURANCE_DELETED:  "patient_insurance:deleted",

    // ── Birth records ──────────────────────────────────────────────────────────
    BIRTH_CREATED:             "birth:created",
    BIRTH_UPDATED:             "birth:updated",
    BIRTH_DELETED:             "birth:deleted",

    // ── Death records ─────────────────────────────────────────────────────────
    DEATH_CREATED:             "death:created",
    DEATH_UPDATED:             "death:updated",
    DEATH_DELETED:             "death:deleted",

    // ── Complaints ────────────────────────────────────────────────────────────
    COMPLAINT_CREATED:         "complaint:created",

    // ── Conditions ────────────────────────────────────────────────────────────
    CONDITION_CREATED:         "condition:created",
    CONDITION_UPDATED:         "condition:updated",
    CONDITION_DELETED:         "condition:deleted",

    // ── Doctors (staff) ───────────────────────────────────────────────────────
    DOCTOR_CREATED:            "doctor:created",
    DOCTOR_UPDATED:            "doctor:updated",
    DOCTOR_DELETED:            "doctor:deleted",

    // ── Physical examinations ─────────────────────────────────────────────────
    PHYSICAL_EXAM_CREATED:     "physical_exam:created",
};

/** Set of all valid activity type values for quick validation */
export const ACTIVITY_TYPE_VALUES = new Set(Object.values(ACTIVITY_TYPES));
