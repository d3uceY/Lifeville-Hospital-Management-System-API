const priorityLevels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    critical: 'Critical',
} as const;

export type PriorityLevel = keyof typeof priorityLevels;

const NOTIFICATION_TYPES = {
    APPOINTMENT: "APPOINTMENT",
    LAB_TEST: "LAB_TEST",
    PATIENT: "PATIENT",
    INPATIENT: "INPATIENT",
    INPATIENT_DISCHARGED: "INPATIENT_DISCHARGED",
    PATIENT_VISIT: "PATIENT_VISIT",
    PATIENT_VISIT_CHECKOUT: "PATIENT_VISIT_CHECKOUT",
    VITAL_SIGNS: "VITAL_SIGNS",
    COMPLAINT: "COMPLAINT",
    DOCTOR_NOTE: "DOCTOR_NOTE",
    NURSE_NOTE: "NURSE_NOTE",
    PHYSICAL_EXAMINATION: "PHYSICAL_EXAMINATION",
    DIAGNOSIS: "DIAGNOSIS"
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export { priorityLevels, NOTIFICATION_TYPES };