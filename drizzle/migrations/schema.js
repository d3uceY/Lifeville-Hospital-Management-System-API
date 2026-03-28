import { pgTable, index, unique, integer, date, varchar, text, boolean, foreignKey, serial, numeric, timestamp, check, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ─── Billing category & type enums ───────────────────────────────────────────
export const billCategoryEnum = pgEnum("bill_category_enum", ["lab", "drug", "service", "ward", "food", "consultation", "daily_charge"])
export const billingTypeEnum = pgEnum("billing_type_enum", ["credit", "pay_now"])

export const genderEnum = pgEnum("gender_enum", ['Male', 'Female', 'Other'])
export const patientTypeEnum = pgEnum("patient_type_enum", ['INPATIENT', 'OUTPATIENT', 'NULL'])


export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	label: varchar({ length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("roles_name_key").on(table.name),
]);

export const patients = pgTable("patients", {
	patientId: integer("patient_id").primaryKey().generatedAlwaysAsIdentity({ name: "patients_patient_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	date: date().notNull(),
	hospitalNumber: integer("hospital_number").notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	otherNames: varchar("other_names", { length: 255 }),
	sex: varchar({ length: 10 }).notNull(),
	maritalStatus: varchar("marital_status", { length: 50 }),
	dateOfBirth: date("date_of_birth").notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	address: text(),
	occupation: varchar({ length: 255 }),
	placeOfWorkAddress: text("place_of_work_address"),
	religion: varchar({ length: 255 }),
	nationality: varchar({ length: 255 }),
	nextOfKin: varchar("next_of_kin", { length: 255 }),
	relationship: varchar({ length: 255 }),
	nextOfKinPhone: varchar("next_of_kin_phone", { length: 20 }),
	nextOfKinAddress: text("next_of_kin_address"),
	pastSurgicalHistory: text("past_surgical_history"),
	familyHistory: text("family_history"),
	socialHistory: text("social_history"),
	drugHistory: text("drug_history"),
	allergies: text(),
	dietaryRestrictions: text("dietary_restrictions"),
	dietAllergiesToDrugs: text("diet_allergies_to_drugs"),
	pastMedicalHistory: text("past_medical_history"),
	surname: varchar({ length: 255 }),
	patientType: patientTypeEnum("patient_type"),
	isInpatient: boolean("is_inpatient").default(false).notNull(),
}, (table) => [
	index("idx_patients_hospital_number").using("btree", table.hospitalNumber.asc().nullsLast().op("int4_ops")),
	index("idx_patients_name").using("btree", table.surname.asc().nullsLast().op("text_ops"), table.firstName.asc().nullsLast().op("text_ops")),
	index("idx_patients_name_trgm").using("gin", table.surname.asc().nullsLast().op("gin_trgm_ops")),
	unique("unique_hospital_number").on(table.hospitalNumber),
]);

// ── Services (price catalog) ──────────────────────────────────────────────────
export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull().default("service"),
	price: numeric({ precision: 12, scale: 2 }).notNull().default("0"),
	isVariablePrice: boolean("is_variable_price").notNull().default(false),
	isSystem: boolean("is_system").notNull().default(false),
	createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
});

// ── Invoices (one per visit or admission) ─────────────────────────────────────
export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	admissionId: integer("admission_id"),
	visitId: integer("visit_id"),
	patientId: integer("patient_id"),
	invoiceNumber: text("invoice_number").notNull(),
	status: text().notNull().default("open"),
	createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("invoices_invoice_number_key").on(table.invoiceNumber),
	foreignKey({ columns: [table.admissionId], foreignColumns: [inpatientAdmissions.id], name: "invoices_admission_id_fkey" }).onDelete("set null"),
	foreignKey({ columns: [table.visitId], foreignColumns: [patientVisits.id], name: "invoices_visit_id_fkey" }).onDelete("set null"),
	foreignKey({ columns: [table.patientId], foreignColumns: [patients.patientId], name: "invoices_patient_id_fkey" }).onDelete("set null"),
]);

export const billItems = pgTable("bill_items", {
	id: serial().primaryKey().notNull(),
	// Legacy column – nullable so old bills keep working; new event-driven items use invoice_id instead
	billId: integer("bill_id"),
	// New event-driven columns
	invoiceId: integer("invoice_id"),
	serviceId: integer("service_id"),
	description: text().notNull(),
	category: text().notNull().default("service"),
	unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
	quantity: integer().default(1).notNull(),
	lineTotal: numeric("line_total", { precision: 12, scale: 2 }).generatedAlwaysAs(sql`(unit_price * (quantity)::numeric)`),
	discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
	billingType: text("billing_type").notNull().default("credit"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.billId],
		foreignColumns: [bills.id],
		name: "bill_items_bill_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.invoiceId],
		foreignColumns: [invoices.id],
		name: "bill_items_invoice_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.serviceId],
		foreignColumns: [services.id],
		name: "bill_items_service_id_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.createdBy],
		foreignColumns: [users.id],
		name: "bill_items_created_by_fkey"
	}).onDelete("set null"),
]);

// ── Billing payments ──────────────────────────────────────────────────────────
export const billingPayments = pgTable("billing_payments", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id").notNull(),
	amount: numeric({ precision: 12, scale: 2 }).notNull(),
	paymentMethod: text("payment_method").notNull().default("cash"),
	notes: text(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: "string" }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({ columns: [table.invoiceId], foreignColumns: [invoices.id], name: "billing_payments_invoice_id_fkey" }).onDelete("cascade"),
	foreignKey({ columns: [table.createdBy], foreignColumns: [users.id], name: "billing_payments_created_by_fkey" }).onDelete("set null"),
]);

export const bills = pgTable("bills", {
	id: serial().primaryKey().notNull(),
	billNumber: text("bill_number").notNull(),
	patientId: integer("patient_id").notNull(),
	issuedBy: varchar("issued_by", { length: 100 }).notNull(),
	billDate: timestamp("bill_date", { mode: 'string' }).defaultNow().notNull(),
	subtotal: numeric({ precision: 12, scale:  2 }).notNull(),
	discount: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	tax: numeric({ precision: 12, scale:  2 }).default('0').notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('unpaid').notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }),
	amountPaid: numeric("amount_paid", { precision: 12, scale:  2 }).default('0').notNull(),
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	notes: text(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	unique("bills_bill_number_key").on(table.billNumber),
]);

export const labTestTypes = pgTable("lab_test_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("lab_test_types_name_key").on(table.name),
]);

export const symptomTypes = pgTable("symptom_types", {
	symptomTypeId: serial("symptom_type_id").primaryKey().notNull(),
	symptomText: text("symptom_text").notNull(),
}, (table) => [
	unique("symptom_types_symptom_text_key").on(table.symptomText),
]);

export const symptomHeads = pgTable("symptom_heads", {
	symptomHeadId: serial("symptom_head_id").primaryKey().notNull(),
	symptomHead: text("symptom_head").notNull(),
	symptomTypeId: integer("symptom_type_id").notNull(),
	symptomDescription: text("symptom_description"),
}, (table) => [
	foreignKey({
			columns: [table.symptomTypeId],
			foreignColumns: [symptomTypes.symptomTypeId],
			name: "symptom_heads_symptom_type_id_fkey"
		}),
]);

export const appointments = pgTable("appointments", {
	appointmentId: serial("appointment_id").primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	doctorId: integer("doctor_id"),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }).notNull(),
	notes: text(),
	status: varchar({ length: 20 }).default('scheduled').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_appointments_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_appointments_doctor_id").using("btree", table.doctorId.asc().nullsLast().op("int4_ops")),
	index("idx_appointments_patient_created_at").using("btree", table.patientId.asc().nullsLast().op("int4_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_appointments_patient_id").using("btree", table.patientId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "appointments_patient_id_fkey"
		}).onDelete("cascade"),
	check("appointments_status_check", sql`(status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'pending'::character varying, 'canceled'::character varying, 'completed'::character varying])::text[])`),
]);

export const doctors = pgTable("doctors", {
	doctorId: serial("doctor_id").primaryKey().notNull(),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	specialty: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 20 }).default('staff').notNull(),
	refreshToken: text("refresh_token"),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar({ length: 255 }).default('Super Admin').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	roleId: integer("role_id"),
	isDeleted: boolean("is_deleted").default(false).notNull(),
}, (table) => [
	index("idx_users_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_users_name_trgm").using("gin", table.name.asc().nullsLast().op("gin_trgm_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [table.id],
			name: "users_created_by_fkey"
		}),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_role_id_fkey"
		}).onDelete("set null"),
	unique("users_email_key").on(table.email),
]);

export const bedTypes = pgTable("bed_types", {
	id: serial().primaryKey().notNull(),
	typeName: text("type_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const beds = pgTable("beds", {
	id: serial().primaryKey().notNull(),
	bedTypeId: integer("bed_type_id").notNull(),
	bedGroupId: integer("bed_group_id").notNull(),
	bedName: text("bed_name").notNull(),
	used: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.bedTypeId],
			foreignColumns: [bedTypes.id],
			name: "beds_bed_type_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.bedGroupId],
			foreignColumns: [bedGroups.id],
			name: "beds_bed_group_id_fkey"
		}).onDelete("restrict"),
]);

export const bedGroups = pgTable("bed_groups", {
	id: serial().primaryKey().notNull(),
	groupName: text("group_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	recipientId: integer("recipient_id"),
	// Legacy single-role column — kept for backward compat; prefer recipientRoles
	recipientRole: varchar("recipient_role", { length: 50 }),
	// New: one notification row targets multiple roles
	recipientRoles: text("recipient_roles").array(),
	type: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }),
	message: text(),
	data: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_recipient_id").using("btree", table.recipientId.asc().nullsLast().op("int4_ops")),
	index("idx_notifications_recipient_id_created_at").using("btree", table.recipientId.asc().nullsLast().op("int4_ops"), table.createdAt.desc().nullsFirst().op("int4_ops")),
	index("idx_notifications_recipient_role").using("btree", table.recipientRole.asc().nullsLast().op("text_ops")),
	index("idx_notifications_recipient_role_created_at").using("btree", table.recipientRole.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("timestamp_ops")),
]);

export const procedures = pgTable("procedures", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	procedureName: text("procedure_name").notNull(),
	comments: text(),
	performedAt: timestamp("performed_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	serviceId: integer("service_id"),
	unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0"),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "procedures_patient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "procedures_service_id_fkey"
		}).onDelete("set null"),
]);

export const doctorsNotes = pgTable("doctors_notes", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	note: text().notNull(),
	recordedBy: text("recorded_by").notNull(),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "doctors_notes_patient_id_fkey"
		}).onDelete("cascade"),
]);

export const history = pgTable("history", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 100 }).notNull(),
	recordedBy: varchar("recorded_by", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	description: text(),
});

export const dischargeSummary = pgTable("discharge_summary", {
	id: serial().primaryKey().notNull(),
	finalDiagnosis: text("final_diagnosis").notNull(),
	diagnosisDetails: text("diagnosis_details"),
	treatmentGiven: text("treatment_given"),
	outcome: text(),
	condition: text(),
	dischargeDateTime: timestamp("discharge_date_time", { mode: 'string' }).notNull(),
	followUp: text("follow_up"),
	patientId: integer("patient_id").notNull(),
	admissionId: integer("admission_id").notNull(),
	doctorId: integer("doctor_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_discharge_admission").using("btree", table.admissionId.asc().nullsLast().op("int4_ops")),
]);

export const vitalSigns = pgTable("vital_signs", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	recordedAt: timestamp("recorded_at", { mode: 'string' }),
	temperature: numeric(),
	bloodPressureSystolic: integer("blood_pressure_systolic"),
	bloodPressureDiastolic: integer("blood_pressure_diastolic"),
	weight: numeric(),
	pulseRate: integer("pulse_rate"),
	spo2: integer(),
	recordedBy: text("recorded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	height: integer().default(0).notNull(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const nursesNotes = pgTable("nurses_notes", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	note: text().notNull(),
	recordedBy: text("recorded_by").notNull(),
	updatedBy: text("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "nurses_notes_patient_id_fkey"
		}).onDelete("cascade"),
]);

export const notificationReads = pgTable("notification_reads", {
	id: serial().primaryKey().notNull(),
	notificationId: integer("notification_id").notNull(),
	userId: integer("user_id").notNull(),
	readAt: timestamp("read_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notification_reads_id").using("btree", table.notificationId.asc().nullsLast().op("int4_ops")),
	index("idx_notification_reads_notification_user").using("btree", table.notificationId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	index("idx_notification_user").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.notificationId],
			foreignColumns: [notifications.id],
			name: "notification_reads_notification_id_fkey"
		}).onDelete("cascade"),
	unique("notification_reads_notification_id_user_id_key").on(table.notificationId, table.userId),
]);

export const birthRecords = pgTable("birth_records", {
	birthId: serial("birth_id").primaryKey().notNull(),
	childName: varchar("child_name", { length: 150 }).notNull(),
	gender: genderEnum().notNull(),
	birthDate: date("birth_date").notNull(),
	motherName: varchar("mother_name", { length: 150 }).notNull(),
	fatherName: varchar("father_name", { length: 150 }),
	weight: numeric({ precision: 5, scale:  2 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	address: text(),
	report: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const labTests = pgTable("lab_tests", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	prescribedBy: text("prescribed_by"),
	testType: text("test_type").notNull(),
	status: text().default('to_do').notNull(),
	comments: text(),
	results: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	images: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "lab_tests_patient_id_fkey"
		}).onDelete("cascade"),
]);

export const deathRecords = pgTable("death_records", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	deathDate: timestamp("death_date", { mode: 'string' }).notNull(),
	guardian: varchar({ length: 100 }),
	attachment: text(),
	report: text(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "death_records_patient_id_fkey"
		}),
]);

export const inpatientAdmissions = pgTable("inpatient_admissions", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	symptomTypes: text("symptom_types").array().notNull(),
	symptomDescription: text("symptom_description"),
	note: text(),
	previousMedicalIssue: text("previous_medical_issue"),
	admissionDate: timestamp("admission_date", { mode: 'string' }).notNull(),
	consultantDoctorId: integer("consultant_doctor_id").notNull(),
	bedGroup: varchar("bed_group", { length: 50 }),
	bedNumber: varchar("bed_number", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	dischargeCondition: text("discharge_condition").default('on admission'),
	endDate: timestamp("end_date", { mode: 'string' }),
}, (table) => [
	index("idx_inpatient_discharge_created_at").using("btree", table.dischargeCondition.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_inpatient_patient_created_at").using("btree", table.patientId.asc().nullsLast().op("timestamp_ops"), table.createdAt.desc().nullsFirst().op("int4_ops")),
	index("idx_inpatient_patient_discharge").using("btree", table.patientId.asc().nullsLast().op("int4_ops"), table.dischargeCondition.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "inpatient_admissions_patient_id_fkey"
		}).onDelete("cascade"),
]);

export const complaints = pgTable("complaints", {
	id: serial().primaryKey().notNull(),
	recordedBy: text("recorded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	patientId: integer("patient_id").notNull(),
	complaint: text(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "complaints_patient_id_fkey"
		}),
]);

export const physicalExaminations = pgTable("physical_examinations", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	generalAppearance: text("general_appearance"),
	heent: text(),
	cardiovascular: text(),
	respiration: text(),
	gastrointestinal: text(),
	gynecologyObstetrics: text("gynecology_obstetrics"),
	musculoskeletal: text(),
	neurological: text(),
	skin: text(),
	findings: text(),
	genitourinary: text(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "physical_examinations_patient_id_fkey"
		}).onDelete("cascade"),
]);

export const diagnoses = pgTable("diagnoses", {
	diagnosisId: serial("diagnosis_id").primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	diagnosisDate: timestamp("diagnosis_date", { mode: 'string' }).defaultNow(),
	condition: text().notNull(),
	notes: text(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "diagnoses_patient_id_fkey"
		}),
]);

export const prescriptions = pgTable("prescriptions", {
	prescriptionId: serial("prescription_id").primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	prescribedBy: text("prescribed_by").notNull(),
	prescriptionDate: timestamp("prescription_date", { mode: 'string' }).defaultNow(),
	notes: text(),
	status: text(),
	updatedBy: text("updated_by"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "prescriptions_patient_id_fkey"
		}),
]);

export const inpatientJournal = pgTable("inpatient_journal", {
	id: serial().primaryKey().notNull(),
	patientId: integer("patient_id").notNull(),
	admissionId: integer("admission_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	updatedBy: text("updated_by"),
	comment: text(),
	comments: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "fk_patient"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [inpatientAdmissions.id],
			name: "fk_admission"
		}).onDelete("cascade"),
]);

export const patientVisits = pgTable("patient_visits", {
	id: serial().primaryKey().notNull(),
	doctorId: integer("doctor_id").notNull(),
	patientId: integer("patient_id").notNull(),
	recordedBy: text("recorded_by").notNull(),
	purpose: text().notNull(),
	visitType: text("visit_type").default("outpatient").notNull(),
	checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	checkOutTime: timestamp("check_out_time", { withTimezone: true, mode: 'string' }),
	admissionId: integer("admission_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "patient_visits_doctor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.patientId],
			name: "patient_visits_patient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.admissionId],
			foreignColumns: [inpatientAdmissions.id],
			name: "patient_visits_admission_id_fkey"
		}).onDelete("set null"),
]);

export const prescriptionItems = pgTable("prescription_items", {
	prescriptionItemId: serial("prescription_item_id").primaryKey().notNull(),
	prescriptionId: integer("prescription_id").notNull(),
	drugName: text("drug_name").notNull(),
	dosage: text().notNull(),
	frequency: text().notNull(),
	duration: text().notNull(),
	instructions: text(),
	serviceId: integer("service_id"),
	unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0"),
}, (table) => [
	foreignKey({
			columns: [table.prescriptionId],
			foreignColumns: [prescriptions.prescriptionId],
			name: "prescription_items_prescription_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "prescription_items_service_id_fkey"
		}).onDelete("set null"),
]);

// ─── Settings tables (all single-row config tables, id = 1) ──────────────────

export const settingsHospitalInfo = pgTable("settings_hospital_info", {
	id: integer().primaryKey().default(1).notNull(),
	hospitalName: varchar("hospital_name", { length: 255 }).notNull().default("Lifeville Specialist Hospital"),
	hospitalShortName: varchar("hospital_short_name", { length: 100 }).default("Lifeville"),
	licenseNumber: varchar("license_number", { length: 100 }),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const settingsContact = pgTable("settings_contact", {
	id: integer().primaryKey().default(1).notNull(),
	address: text(),
	city: varchar({ length: 100 }),
	country: varchar({ length: 100 }).default("Nigeria"),
	phone: varchar({ length: 30 }),
	email: varchar({ length: 255 }),
	website: varchar({ length: 255 }),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const settingsPrefixes = pgTable("settings_prefixes", {
	id: integer().primaryKey().default(1).notNull(),
	billNumberPrefix: varchar("bill_number_prefix", { length: 20 }).notNull().default("BILL-"),
	patientIdPrefix: varchar("patient_id_prefix", { length: 20 }).notNull().default("PAT-"),
	labIdPrefix: varchar("lab_id_prefix", { length: 20 }).notNull().default("LAB-"),
	admissionIdPrefix: varchar("admission_id_prefix", { length: 20 }).notNull().default("ADM-"),
	birthIdPrefix: varchar("birth_id_prefix", { length: 20 }).notNull().default("BIRTH-"),
	deathIdPrefix: varchar("death_id_prefix", { length: 20 }).notNull().default("DEATH-"),
	appointmentIdPrefix: varchar("appointment_id_prefix", { length: 20 }).notNull().default("APT-"),
	invoiceIdPrefix: varchar("invoice_id_prefix", { length: 20 }).notNull().default("INV-"),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const settingsBilling = pgTable("settings_billing", {
	id: integer().primaryKey().default(1).notNull(),
	currencyCode: varchar("currency_code", { length: 10 }).notNull().default("NGN"),
	currencySymbolPosition: varchar("currency_symbol_position", { length: 10 }).notNull().default("before"),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});

export const settingsDocuments = pgTable("settings_documents", {
	id: integer().primaryKey().default(1).notNull(),
	labReportFooter: text("lab_report_footer"),
	printFooterText: text("print_footer_text"),
	showHospitalHeader: boolean("show_hospital_header").notNull().default(true),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});
