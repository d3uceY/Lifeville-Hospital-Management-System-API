/**
 * Database types inferred from the Drizzle schema.
 * Use `Select*` for query result rows and `Insert*` for insert/update payloads.
 */
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  patients,
  users,
  roles,
  mediaContent,
  patientVisits,
  vitalSigns,
  appointments,
  doctors,
  notifications,
  notificationReads,
  inpatientAdmissions,
  dischargeSummary,
  beds,
  bedTypes,
  bedGroups,
  bills,
  billItems,
  invoices,
  billingPayments,
  services,
  labTests,
  symptomTypes,
  symptomHeads,
  diagnoses,
  prescriptions,
  prescriptionItems,
  procedures,
  complaints,
  physicalExaminations,
  doctorsNotes,
  nursesNotes,
  history,
  activityLogs,
  insuranceProviders,
  insurancePlans,
  patientInsurance,
  birthRecords,
  deathRecords,
  inpatientJournal,
  settingsHospitalInfo,
  settingsContact,
  settingsPrefixes,
  settingsBilling,
  settingsDocuments,
  settingsEmail,
  settingsStorage,
} from "../../drizzle/migrations/schema.js";

// ─── Patient ──────────────────────────────────────────────────────────────────
export type SelectPatient = InferSelectModel<typeof patients>;
export type InsertPatient = InferInsertModel<typeof patients>;

// ─── Users ────────────────────────────────────────────────────────────────────
export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

// ─── Roles ────────────────────────────────────────────────────────────────────
export type SelectRole = InferSelectModel<typeof roles>;
export type InsertRole = InferInsertModel<typeof roles>;

// ─── Media ────────────────────────────────────────────────────────────────────
export type SelectMediaContent = InferSelectModel<typeof mediaContent>;
export type InsertMediaContent = InferInsertModel<typeof mediaContent>;

// ─── Visits ───────────────────────────────────────────────────────────────────
export type SelectPatientVisit = InferSelectModel<typeof patientVisits>;
export type InsertPatientVisit = InferInsertModel<typeof patientVisits>;

// ─── Vital Signs ──────────────────────────────────────────────────────────────
export type SelectVitalSigns = InferSelectModel<typeof vitalSigns>;
export type InsertVitalSigns = InferInsertModel<typeof vitalSigns>;

// ─── Appointments ─────────────────────────────────────────────────────────────
export type SelectAppointment = InferSelectModel<typeof appointments>;
export type InsertAppointment = InferInsertModel<typeof appointments>;

// ─── Doctors ──────────────────────────────────────────────────────────────────
export type SelectDoctor = InferSelectModel<typeof doctors>;
export type InsertDoctor = InferInsertModel<typeof doctors>;

// ─── Notifications ────────────────────────────────────────────────────────────
export type SelectNotification = InferSelectModel<typeof notifications>;
export type InsertNotification = InferInsertModel<typeof notifications>;

export type SelectNotificationRead = InferSelectModel<typeof notificationReads>;
export type InsertNotificationRead = InferInsertModel<typeof notificationReads>;

// ─── Admissions ───────────────────────────────────────────────────────────────
export type SelectInpatientAdmission = InferSelectModel<typeof inpatientAdmissions>;
export type InsertInpatientAdmission = InferInsertModel<typeof inpatientAdmissions>;

export type SelectDischargeSummary = InferSelectModel<typeof dischargeSummary>;
export type InsertDischargeSummary = InferInsertModel<typeof dischargeSummary>;

// ─── Beds ─────────────────────────────────────────────────────────────────────
export type SelectBed = InferSelectModel<typeof beds>;
export type InsertBed = InferInsertModel<typeof beds>;

export type SelectBedType = InferSelectModel<typeof bedTypes>;
export type InsertBedType = InferInsertModel<typeof bedTypes>;

export type SelectBedGroup = InferSelectModel<typeof bedGroups>;
export type InsertBedGroup = InferInsertModel<typeof bedGroups>;

// ─── Billing ──────────────────────────────────────────────────────────────────
export type SelectBill = InferSelectModel<typeof bills>;
export type InsertBill = InferInsertModel<typeof bills>;

export type SelectBillItem = InferSelectModel<typeof billItems>;
export type InsertBillItem = InferInsertModel<typeof billItems>;

export type SelectInvoice = InferSelectModel<typeof invoices>;
export type InsertInvoice = InferInsertModel<typeof invoices>;

export type SelectBillingPayment = InferSelectModel<typeof billingPayments>;
export type InsertBillingPayment = InferInsertModel<typeof billingPayments>;

export type SelectService = InferSelectModel<typeof services>;
export type InsertService = InferInsertModel<typeof services>;

// ─── Lab Tests ────────────────────────────────────────────────────────────────
export type SelectLabTest = InferSelectModel<typeof labTests>;
export type InsertLabTest = InferInsertModel<typeof labTests>;

// ─── Symptoms ─────────────────────────────────────────────────────────────────
export type SelectSymptomType = InferSelectModel<typeof symptomTypes>;
export type InsertSymptomType = InferInsertModel<typeof symptomTypes>;

export type SelectSymptomHead = InferSelectModel<typeof symptomHeads>;
export type InsertSymptomHead = InferInsertModel<typeof symptomHeads>;

// ─── Clinical ─────────────────────────────────────────────────────────────────
export type SelectDiagnosis = InferSelectModel<typeof diagnoses>;
export type InsertDiagnosis = InferInsertModel<typeof diagnoses>;

export type SelectPrescription = InferSelectModel<typeof prescriptions>;
export type InsertPrescription = InferInsertModel<typeof prescriptions>;

export type SelectProcedure = InferSelectModel<typeof procedures>;
export type InsertProcedure = InferInsertModel<typeof procedures>;

export type SelectComplaint = InferSelectModel<typeof complaints>;
export type InsertComplaint = InferInsertModel<typeof complaints>;

export type SelectPhysicalExamination = InferSelectModel<typeof physicalExaminations>;
export type InsertPhysicalExamination = InferInsertModel<typeof physicalExaminations>;

export type SelectDoctorNote = InferSelectModel<typeof doctorsNotes>;
export type InsertDoctorNote = InferInsertModel<typeof doctorsNotes>;

export type SelectNurseNote = InferSelectModel<typeof nursesNotes>;
export type InsertNurseNote = InferInsertModel<typeof nursesNotes>;

export type SelectHistory = InferSelectModel<typeof history>;

// ─── Activity Log ─────────────────────────────────────────────────────────────
export type SelectActivityLog = InferSelectModel<typeof activityLogs>;
export type InsertActivityLog = InferInsertModel<typeof activityLogs>;

// ─── Insurance ────────────────────────────────────────────────────────────────
export type SelectInsuranceProvider = InferSelectModel<typeof insuranceProviders>;
export type InsertInsuranceProvider = InferInsertModel<typeof insuranceProviders>;

export type SelectInsurancePlan = InferSelectModel<typeof insurancePlans>;
export type InsertInsurancePlan = InferInsertModel<typeof insurancePlans>;

export type SelectPatientInsurance = InferSelectModel<typeof patientInsurance>;
export type InsertPatientInsurance = InferInsertModel<typeof patientInsurance>;

// ─── Birth & Death Records ────────────────────────────────────────────────────
export type SelectBirthRecord = InferSelectModel<typeof birthRecords>;
export type InsertBirthRecord = InferInsertModel<typeof birthRecords>;

export type SelectDeathRecord = InferSelectModel<typeof deathRecords>;
export type InsertDeathRecord = InferInsertModel<typeof deathRecords>;

// ─── Inpatient Journal ────────────────────────────────────────────────────────
export type SelectInpatientJournal = InferSelectModel<typeof inpatientJournal>;
export type InsertInpatientJournal = InferInsertModel<typeof inpatientJournal>;

// ─── Prescription Items ───────────────────────────────────────────────────────
export type SelectPrescriptionItem = InferSelectModel<typeof prescriptionItems>;
export type InsertPrescriptionItem = InferInsertModel<typeof prescriptionItems>;

// ─── Settings ─────────────────────────────────────────────────────────────────
export type SelectSettingsHospitalInfo = InferSelectModel<typeof settingsHospitalInfo>;
export type SelectSettingsContact = InferSelectModel<typeof settingsContact>;
export type SelectSettingsPrefixes = InferSelectModel<typeof settingsPrefixes>;
export type SelectSettingsBilling = InferSelectModel<typeof settingsBilling>;
export type SelectSettingsDocuments = InferSelectModel<typeof settingsDocuments>;
export type SelectSettingsEmail = InferSelectModel<typeof settingsEmail>;
export type SelectSettingsStorage = InferSelectModel<typeof settingsStorage>;
