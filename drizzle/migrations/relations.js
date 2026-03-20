import { relations } from "drizzle-orm/relations";
import { bills, billItems, symptomTypes, symptomHeads, patients, appointments, users, bedTypes, beds, bedGroups, procedures, doctorsNotes, nursesNotes, notifications, notificationReads, labTests, deathRecords, inpatientAdmissions, complaints, physicalExaminations, diagnoses, prescriptions, inpatientJournal, patientVisits, prescriptionItems } from "./schema";

export const billItemsRelations = relations(billItems, ({one}) => ({
	bill: one(bills, {
		fields: [billItems.billId],
		references: [bills.id]
	}),
}));

export const billsRelations = relations(bills, ({many}) => ({
	billItems: many(billItems),
}));

export const symptomHeadsRelations = relations(symptomHeads, ({one}) => ({
	symptomType: one(symptomTypes, {
		fields: [symptomHeads.symptomTypeId],
		references: [symptomTypes.symptomTypeId]
	}),
}));

export const symptomTypesRelations = relations(symptomTypes, ({many}) => ({
	symptomHeads: many(symptomHeads),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	patient: one(patients, {
		fields: [appointments.patientId],
		references: [patients.patientId]
	}),
}));

export const patientsRelations = relations(patients, ({many}) => ({
	appointments: many(appointments),
	procedures: many(procedures),
	doctorsNotes: many(doctorsNotes),
	nursesNotes: many(nursesNotes),
	labTests: many(labTests),
	deathRecords: many(deathRecords),
	inpatientAdmissions: many(inpatientAdmissions),
	complaints: many(complaints),
	physicalExaminations: many(physicalExaminations),
	diagnoses: many(diagnoses),
	prescriptions: many(prescriptions),
	inpatientJournals: many(inpatientJournal),
	patientVisits: many(patientVisits),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	user: one(users, {
		fields: [users.createdBy],
		references: [users.id],
		relationName: "users_createdBy_users_id"
	}),
	users: many(users, {
		relationName: "users_createdBy_users_id"
	}),
	patientVisits: many(patientVisits),
}));

export const bedsRelations = relations(beds, ({one}) => ({
	bedType: one(bedTypes, {
		fields: [beds.bedTypeId],
		references: [bedTypes.id]
	}),
	bedGroup: one(bedGroups, {
		fields: [beds.bedGroupId],
		references: [bedGroups.id]
	}),
}));

export const bedTypesRelations = relations(bedTypes, ({many}) => ({
	beds: many(beds),
}));

export const bedGroupsRelations = relations(bedGroups, ({many}) => ({
	beds: many(beds),
}));

export const proceduresRelations = relations(procedures, ({one}) => ({
	patient: one(patients, {
		fields: [procedures.patientId],
		references: [patients.patientId]
	}),
}));

export const doctorsNotesRelations = relations(doctorsNotes, ({one}) => ({
	patient: one(patients, {
		fields: [doctorsNotes.patientId],
		references: [patients.patientId]
	}),
}));

export const nursesNotesRelations = relations(nursesNotes, ({one}) => ({
	patient: one(patients, {
		fields: [nursesNotes.patientId],
		references: [patients.patientId]
	}),
}));

export const notificationReadsRelations = relations(notificationReads, ({one}) => ({
	notification: one(notifications, {
		fields: [notificationReads.notificationId],
		references: [notifications.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({many}) => ({
	notificationReads: many(notificationReads),
}));

export const labTestsRelations = relations(labTests, ({one}) => ({
	patient: one(patients, {
		fields: [labTests.patientId],
		references: [patients.patientId]
	}),
}));

export const deathRecordsRelations = relations(deathRecords, ({one}) => ({
	patient: one(patients, {
		fields: [deathRecords.patientId],
		references: [patients.patientId]
	}),
}));

export const inpatientAdmissionsRelations = relations(inpatientAdmissions, ({one, many}) => ({
	patient: one(patients, {
		fields: [inpatientAdmissions.patientId],
		references: [patients.patientId]
	}),
	inpatientJournals: many(inpatientJournal),
}));

export const complaintsRelations = relations(complaints, ({one}) => ({
	patient: one(patients, {
		fields: [complaints.patientId],
		references: [patients.patientId]
	}),
}));

export const physicalExaminationsRelations = relations(physicalExaminations, ({one}) => ({
	patient: one(patients, {
		fields: [physicalExaminations.patientId],
		references: [patients.patientId]
	}),
}));

export const diagnosesRelations = relations(diagnoses, ({one}) => ({
	patient: one(patients, {
		fields: [diagnoses.patientId],
		references: [patients.patientId]
	}),
}));

export const prescriptionsRelations = relations(prescriptions, ({one, many}) => ({
	patient: one(patients, {
		fields: [prescriptions.patientId],
		references: [patients.patientId]
	}),
	prescriptionItems: many(prescriptionItems),
}));

export const inpatientJournalRelations = relations(inpatientJournal, ({one}) => ({
	patient: one(patients, {
		fields: [inpatientJournal.patientId],
		references: [patients.patientId]
	}),
	inpatientAdmission: one(inpatientAdmissions, {
		fields: [inpatientJournal.admissionId],
		references: [inpatientAdmissions.id]
	}),
}));

export const patientVisitsRelations = relations(patientVisits, ({one}) => ({
	user: one(users, {
		fields: [patientVisits.doctorId],
		references: [users.id]
	}),
	patient: one(patients, {
		fields: [patientVisits.patientId],
		references: [patients.patientId]
	}),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({one}) => ({
	prescription: one(prescriptions, {
		fields: [prescriptionItems.prescriptionId],
		references: [prescriptions.prescriptionId]
	}),
}));