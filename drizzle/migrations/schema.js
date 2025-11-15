import { pgTable, foreignKey, serial, integer, timestamp, varchar, text, numeric, unique, date, boolean, check, index, pgEnum, jsonb, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
// this is just a suddenc hange 
export const genderEnum = pgEnum("gender_enum", ['Male', 'Female', 'Other'])
export const patientTypeEnum = pgEnum("patient_type_enum", ['INPATIENT', 'OUTPATIENT', 'NULL'])


export const deathRecords = pgTable("death_records", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	death_date: timestamp("death_date", { mode: "string" }).notNull(),
	guardian: varchar({ length: 100 }),
	attachment: text(),
	report: text(),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "death_records_patient_id_fkey",
	}),
]);


export const billItems = pgTable("bill_items", {
	id: serial().primaryKey().notNull(),
	bill_id: integer("bill_id").notNull(),
	description: text().notNull(),
	unit_price: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
	quantity: integer().default(1).notNull(),
	line_total: numeric("line_total", { precision: 12, scale: 2 }).generatedAlwaysAs(
		sql`(unit_price * (quantity)::numeric)`
	),
}, (table) => [
	foreignKey({
		columns: [table.bill_id],
		foreignColumns: [bills.id],
		name: "bill_items_bill_id_fkey",
	}).onDelete("cascade"),
]);



export const bills = pgTable("bills", {
	id: serial().primaryKey().notNull(),
	bill_number: text("bill_number").notNull(),
	patient_id: integer("patient_id").notNull(),
	issued_by: varchar("issued_by", { length: 100 }).notNull(),
	bill_date: timestamp("bill_date", { mode: 'string' }).defaultNow().notNull(),
	subtotal: numeric({ precision: 12, scale: 2 }).notNull(),
	discount: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
	tax: numeric({ precision: 12, scale: 2 }).default('0').notNull(),
	total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
	status: varchar({ length: 20 }).default('unpaid').notNull(),
	payment_method: varchar("payment_method", { length: 20 }),
	amount_paid: numeric("amount_paid", { precision: 12, scale: 2 }).default('0').notNull(),
	payment_date: timestamp("payment_date", { mode: 'string' }),
	notes: text(),
	updated_by: text("updated_by"),
	updated_at: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	unique("bills_bill_number_key").on(table.bill_number),
]);

export const labTestTypes = pgTable("lab_test_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("lab_test_types_name_key").on(table.name),
]);

export const conditions = pgTable("conditions", {
	condition_id: serial("condition_id").primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("conditions_name_key").on(table.name),
]);



export const patients = pgTable("patients", {
	patient_id: integer("patient_id")
		.primaryKey()
		.generatedAlwaysAsIdentity({
			name: "patients_patient_id_seq",
			startWith: 1,
			increment: 1,
			minValue: 1,
			maxValue: 2147483647,
			cache: 1,
		}),

	date: date().notNull(),
	hospital_number: integer("hospital_number").notNull(),
	first_name: varchar("first_name", { length: 255 }).notNull(),
	other_names: varchar("other_names", { length: 255 }),

	sex: varchar("sex", { length: 10 }).notNull(),
	marital_status: varchar("marital_status", { length: 50 }),
	date_of_birth: date("date_of_birth").notNull(),
	phone_number: varchar("phone_number", { length: 20 }),

	address: text("address"),
	occupation: varchar("occupation", { length: 255 }),
	place_of_work_address: text("place_of_work_address"),
	religion: varchar("religion", { length: 255 }),
	nationality: varchar("nationality", { length: 255 }),

	next_of_kin: varchar("next_of_kin", { length: 255 }),
	relationship: varchar("relationship", { length: 255 }),
	next_of_kin_phone: varchar("next_of_kin_phone", { length: 20 }),
	next_of_kin_address: text("next_of_kin_address"),

	past_surgical_history: text("past_surgical_history"),
	family_history: text("family_history"),
	social_history: text("social_history"),
	drug_history: text("drug_history"),

	allergies: text("allergies"),
	dietary_restrictions: text("dietary_restrictions"),
	diet_allergies_to_drugs: text("diet_allergies_to_drugs"),
	past_medical_history: text("past_medical_history"),

	surname: varchar("surname", { length: 255 }),
	patient_type: patientTypeEnum("patient_type"),
	is_inpatient: boolean("is_inpatient").default(false).notNull(),
}, (table) => [
	unique("unique_hospital_number").on(table.hospital_number),
]);

export const physicalExaminations = pgTable("physical_examinations", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	recorded_by: text("recorded_by").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	general_appearance: text("general_appearance"),
	heent: text(),
	cardiovascular: text(),
	respiration: text(),
	gastrointestinal: text(),
	gynecology_obstetrics: text("gynecology_obstetrics"),
	musculoskeletal: text(),
	neurological: text(),
	skin: text(),
	findings: text(),
	genitourinary: text(),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "physical_examinations_patient_id_fkey"
	}).onDelete("cascade"),
]);

export const symptomTypes = pgTable("symptom_types", {
	symptom_type_id: serial("symptom_type_id").primaryKey().notNull(),
	symptom_text: text("symptom_text").notNull(),
}, (table) => [
	unique("symptom_types_symptom_text_key").on(table.symptom_text),
]);

export const symptomHeads = pgTable("symptom_heads", {
	symptom_head_id: serial("symptom_head_id").primaryKey().notNull(),
	symptom_head: text("symptom_head").notNull(),
	symptom_type_id: integer("symptom_type_id").notNull(),
	symptom_description: text("symptom_description"),
}, (table) => [
	foreignKey({
		columns: [table.symptom_type_id],
		foreignColumns: [symptomTypes.symptom_type_id],
		name: "symptom_heads_symptom_type_id_fkey"
	}),
]);

export const labTests = pgTable("lab_tests", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	prescribed_by: text("prescribed_by"),
	test_type: text("test_type").notNull(),
	status: text().default('to_do').notNull(),
	comments: text(),
	results: text(),
	images: text("images").array(),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updated_at: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "lab_tests_patient_id_fkey"
	}).onDelete("cascade"),
]);

export const doctors = pgTable("doctors", {
	doctor_id: serial("doctor_id").primaryKey().notNull(),
	first_name: varchar("first_name", { length: 50 }).notNull(),
	last_name: varchar("last_name", { length: 50 }).notNull(),
	specialty: varchar({ length: 100 }),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const appointments = pgTable("appointments", {
	appointment_id: serial("appointment_id").primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	doctor_id: integer("doctor_id"),
	appointment_date: timestamp("appointment_date", { mode: 'string' }).notNull(),
	notes: text(),
	status: varchar({ length: 20 }).default('scheduled').notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updated_at: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "appointments_patient_id_fkey"
	}).onDelete("cascade"),
	check(
		"appointments_status_check",
		sql`(status)::text = ANY (
			(ARRAY[
				'scheduled'::character varying,
				'confirmed'::character varying,
				'pending'::character varying,
				'canceled'::character varying,
				'completed'::character varying
			])::text[]
		)`
	),
]);


export const inpatientAdmissions = pgTable("inpatient_admissions", {
	id: serial("id").primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	symptom_types: text("symptom_types").array().notNull(),
	symptom_description: text("symptom_description"),
	note: text("note"),
	previous_medical_issue: text("previous_medical_issue"),
	admission_date: timestamp("admission_date", { mode: "string" }).notNull(),
	consultant_doctor_id: integer("consultant_doctor_id").notNull(),
	bed_group: varchar("bed_group", { length: 50 }),
	bed_number: varchar("bed_number", { length: 255 }),
	discharge_condition: text("discharge_condition").default("on admission"),
	created_at: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
	end_date: timestamp("end_date", { mode: "string" }),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "inpatient_admissions_patient_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.consultant_doctor_id],
		foreignColumns: [users.id],
		name: "inpatient_admissions_consultant_doctor_id_fkey"
	}),
]);

export const complaints = pgTable("complaints", {
	id: serial().primaryKey().notNull(),
	recorded_by: text("recorded_by").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	patient_id: integer("patient_id").notNull(),
	complaint: text(),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "complaints_patient_id_fkey"
	}),
]);

export const prescriptions = pgTable("prescriptions", {
	prescription_id: serial("prescription_id").primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	prescribed_by: text("prescribed_by").notNull(),
	prescription_date: timestamp("prescription_date", { mode: 'string' }).defaultNow(),
	notes: text(),
	status: text(),
	updated_by: text("updated_by"),
	updated_at: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "prescriptions_patient_id_fkey"
	}),
]);

export const prescriptionItems = pgTable("prescription_items", {
	prescription_item_id: serial("prescription_item_id").primaryKey().notNull(),
	prescription_id: integer("prescription_id").notNull(),
	drug_name: text("drug_name").notNull(),
	dosage: text().notNull(),
	frequency: text().notNull(),
	duration: text().notNull(),
	instructions: text(),
}, (table) => [
	foreignKey({
		columns: [table.prescription_id],
		foreignColumns: [prescriptions.prescription_id],
		name: "prescription_items_prescription_id_fkey"
	}).onDelete("cascade"),
]);

export const diagnoses = pgTable("diagnoses", {
	diagnosis_id: serial("diagnosis_id").primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	recorded_by: text("recorded_by").notNull(),
	diagnosis_date: timestamp("diagnosis_date", { mode: 'string' }).defaultNow(),
	condition: text().notNull(),
	notes: text(),
	updated_by: text("updated_by"),
	updated_at: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "diagnoses_patient_id_fkey"
	}),
]);



export const birthRecords = pgTable("birth_records", {
	birth_id: serial("birth_id").primaryKey().notNull(),
	child_name: varchar("child_name", { length: 150 }).notNull(),
	gender: genderEnum().notNull(),
	birth_date: date("birth_date").notNull(),
	mother_name: varchar("mother_name", { length: 150 }).notNull(),
	father_name: varchar("father_name", { length: 150 }),
	weight: numeric({ precision: 5, scale: 2 }),
	phone_number: varchar("phone_number", { length: 20 }),
	address: text(),
	report: text(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const bedTypes = pgTable("bed_types", {
	id: serial().primaryKey().notNull(),
	type_name: text("type_name").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const beds = pgTable("beds", {
	id: serial().primaryKey().notNull(),
	bed_type_id: integer("bed_type_id").notNull(),
	bed_group_id: integer("bed_group_id").notNull(),
	bed_name: text("bed_name").notNull(),
	used: boolean().default(false).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.bed_type_id],
		foreignColumns: [bedTypes.id],
		name: "beds_bed_type_id_fkey"
	}).onDelete("restrict"),
	foreignKey({
		columns: [table.bed_group_id],
		foreignColumns: [bedGroups.id],
		name: "beds_bed_group_id_fkey"
	}).onDelete("restrict"),
]);

export const bedGroups = pgTable("bed_groups", {
	id: serial().primaryKey().notNull(),
	group_name: text("group_name").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});


export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password_hash: text("password_hash").notNull(),
	role: varchar({ length: 20 }).default('staff').notNull(),
	refresh_token: text("refresh_token"),
	created_by: integer("created_by"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar({ length: 255 }).default('Super Admin').notNull(),
	is_active: boolean("is_active").default(true).notNull(),   // 👈 added here
}, (table) => [
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.created_by],
		foreignColumns: [table.id],
		name: "users_created_by_fkey"
	}),
	unique("users_email_key").on(table.email),
]);

export const procedures = pgTable("procedures", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	recorded_by: text("recorded_by").notNull(),
	procedure_name: text("procedure_name").notNull(),
	comments: text(),
	performed_at: timestamp("performed_at", { mode: 'string' }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "procedures_patient_id_fkey"
	}).onDelete("cascade"),
]);

export const vitalSigns = pgTable("vital_signs", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	recorded_at: timestamp("recorded_at", { mode: 'string' }),
	temperature: numeric(),
	blood_pressure_systolic: integer("blood_pressure_systolic"),
	blood_pressure_diastolic: integer("blood_pressure_diastolic"),
	weight: numeric(),
	pulse_rate: integer("pulse_rate"),
	spo2: integer(),
	recorded_by: text("recorded_by"),
	created_at: timestamp("created_at", { mode: 'string' }),
	height: integer().default(0).notNull(),
	updated_by: text("updated_by"),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const doctorsNotes = pgTable("doctors_notes", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	note: text().notNull(),
	recorded_by: text("recorded_by").notNull(),
	updated_by: text("updated_by"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "doctors_notes_patient_id_fkey"
	}).onDelete("cascade"),
]);

export const nursesNotes = pgTable("nurses_notes", {
	id: serial().primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	note: text().notNull(),
	recorded_by: text("recorded_by").notNull(),
	updated_by: text("updated_by"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "nurses_notes_patient_id_fkey"
	}).onDelete("cascade"),
]);

export const history = pgTable("history", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 100 }).notNull(),
	recorded_by: varchar("recorded_by", { length: 100 }).notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow(),
	description: text(),
});


export const inpatientJournal = pgTable("inpatient_journal", {
	id: serial("id").primaryKey().notNull(),
	patient_id: integer("patient_id").notNull(),
	admission_id: integer("admission_id").notNull(),
	recorded_by: text("recorded_by").notNull(),
	updated_by: text("updated_by"),
	comment: text("comment"),
	comments: text("comments"),
	created_at: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.patient_id],
		foreignColumns: [patients.patient_id],
		name: "inpatient_journal_patient_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.admission_id],
		foreignColumns: [inpatientAdmissions.id],
		name: "inpatient_journal_admission_id_fkey"
	}).onDelete("cascade"),
]);


export const discharge_summary = pgTable("discharge_summary", {
	id: serial("id").primaryKey().notNull(),
	final_diagnosis: text("final_diagnosis").notNull(),
	diagnosis_details: text("diagnosis_details"),
	treatment_given: text("treatment_given"),
	outcome: text("outcome"),
	condition: text("condition"),
	discharge_date_time: timestamp("discharge_date_time", { mode: "date" }).notNull(),
	follow_up: text("follow_up"),
	patient_id: integer("patient_id").notNull(),
	admission_id: integer("admission_id").notNull(),
	doctor_id: integer("doctor_id").notNull(),
	recorded_by: text("recorded_by").notNull(),
	created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const patientVisits = pgTable("patient_visits", {
	id: serial("id").primaryKey(),

	doctor_id: integer("doctor_id")
		.notNull()
		.references(() => users.id, { onDelete: "set null" }),

	patient_id: integer("patient_id")
		.notNull()
		.references(() => patients.patient_id, { onDelete: "cascade" }),

	recorded_by: text("recorded_by").notNull(),

	purpose: text("purpose").notNull(),

	created_at: timestamp("created_at", { withTimezone: true })
		.defaultNow(),
});



export const notificationReads = pgTable("notification_reads", {
	id: serial("id").primaryKey(),
	notification_id: integer("notification_id")
		.notNull()
		.references(() => notifications.id, { onDelete: "cascade" }),
	user_id: integer("user_id").notNull(),
	read_at: timestamp("read_at").defaultNow(),
}, (table) => ({
	uniqNotificationUser: uniqueIndex("uniq_notification_user").on(
		table.notification_id,
		table.user_id
	),
})
);


export const notifications = pgTable("notifications", {
	id: serial("id").primaryKey(),
	recipient_id: integer("recipient_id"),
	recipient_role: varchar("recipient_role", { length: 50 }),
	type: varchar("type", { length: 100 }).notNull(),
	title: varchar("title", { length: 255 }),
	message: text("message"),
	data: jsonb("data"),
	created_at: timestamp("created_at").defaultNow(),
});


