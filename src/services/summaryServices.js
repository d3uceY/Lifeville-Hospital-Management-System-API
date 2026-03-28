import { db } from "../../drizzle-db.js";
import { query } from "../../drizzle-db.js";
import { diagnoses, labTests, vitalSigns, inpatientAdmissions, users, patientVisits, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull } from "drizzle-orm";


/**
 * Returns all 5 summary datasets for the patient dashboard in a single call.
 * Each dataset is limited to the most recent N records.
 */
export const getPatientDashboardSummary = async (patientId) => {
    const id = Number(patientId);

    const [admissionsResult, diagnosesResult, labTestsResult, vitalSignsResult, visitsResult] = await Promise.all([
        db.select({
            admissionDate: inpatientAdmissions.admissionDate,
            consultantDoctorName: users.name,
            dischargeCondition: inpatientAdmissions.dischargeCondition,
        })
            .from(inpatientAdmissions)
            .innerJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
            .where(eq(inpatientAdmissions.patientId, id))
            .orderBy(desc(inpatientAdmissions.createdAt))
            .limit(8),

        db.select({
            diagnosisDate: diagnoses.diagnosisDate,
            consultantDoctorName: diagnoses.recordedBy,
            condition: diagnoses.condition,
        })
            .from(diagnoses)
            .where(eq(diagnoses.patientId, id))
            .orderBy(desc(diagnoses.diagnosisDate))
            .limit(8),

        db.select({
            testDate: labTests.createdAt,
            consultantDoctorName: labTests.prescribedBy,
            testType: labTests.testType,
            status: labTests.status,
        })
            .from(labTests)
            .where(eq(labTests.patientId, id))
            .orderBy(desc(labTests.createdAt))
            .limit(8),

        db.select()
            .from(vitalSigns)
            .where(eq(vitalSigns.patientId, id))
            .orderBy(desc(vitalSigns.createdAt))
            .limit(3),

        db.select({
            id: patientVisits.id,
            checkInTime: patientVisits.checkInTime,
            checkOutTime: patientVisits.checkOutTime,
            visitType: patientVisits.visitType,
            purpose: patientVisits.purpose,
            doctorName: users.name,
        })
            .from(patientVisits)
            .leftJoin(users, eq(patientVisits.doctorId, users.id))
            .where(eq(patientVisits.patientId, id))
            .orderBy(desc(patientVisits.checkInTime))
            .limit(8),
    ]);

    return {
        admissions: admissionsResult,
        diagnoses: diagnosesResult,
        labTests: labTestsResult,
        vitalSigns: vitalSignsResult,
        visits: visitsResult,
    };
};


export const getAdmissionSummaryByPatientId = async (patientId) => {
    const result = await db.select({
        admissionDate: inpatientAdmissions.createdAt,
        consultantDoctorName: users.name,
        dischargeCondition: inpatientAdmissions.dischargeCondition,
    }).from(inpatientAdmissions)
        .innerJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
        .where(eq(inpatientAdmissions.patientId, patientId))
        .orderBy(desc(inpatientAdmissions.createdAt))
        .limit(8);

    return result;
}

export const getDiagnosisSummaryByPatientId = async (patientId) => {

    const result = await db.select({
        diagnosisDate: diagnoses.diagnosisDate,
        consultantDoctorName: diagnoses.recordedBy,
        condition: diagnoses.condition,
    }).from(diagnoses)
        .where(eq(diagnoses.patientId, patientId))
        .orderBy(desc(diagnoses.diagnosisDate))
        .limit(8);
    return result;
}

export const getLabTestSummaryByPatientId = async (patientId) => {
    const result = await db.select({
        testDate: labTests.createdAt,
        consultantDoctorName: labTests.prescribedBy,
        testType: labTests.testType,
        status: labTests.status,
    }).from(labTests)
        .where(eq(labTests.patientId, patientId))
        .orderBy(desc(labTests.createdAt))
        .limit(8);
    return result;
}

export const getVitalSignSummaryByPatientId = async (patientId) => {
    const result = await db.select()
        .from(vitalSigns)
        .where(eq(vitalSigns.patientId, patientId))
        .orderBy(desc(vitalSigns.createdAt))
        .limit(3);

    return result;
}

// ─── AI Patient Summary ───────────────────────────────────────────────────────

export const getPatientSummaryData = async (patientId) => {
    const id = Number(patientId);

    const [
        patientResult,
        admissionsResult,
        vitalsResult,
        complaintsResult,
        doctorNotesResult,
        nurseNotesResult,
        physicalExamsResult,
        labTestsResult,
        diagnosesResult,
        prescriptionsResult,
        proceduresResult,
        dischargeSummariesResult,
        visitsResult,
    ] = await Promise.all([
        // Patient profile
        query(`
            SELECT first_name, surname, date_of_birth, sex,
                   allergies, past_medical_history, drug_history, family_history, social_history
            FROM patients
            WHERE patient_id = $1
        `, [id]),

        // Admissions
        query(`
            SELECT ia.admission_date, ia.discharge_condition, ia.symptom_types,
                   ia.symptom_description, ia.note, ia.end_date, ia.bed_group,
                   u.name AS doctor_name
            FROM inpatient_admissions ia
            LEFT JOIN users u ON ia.consultant_doctor_id = u.id
            WHERE ia.patient_id = $1
            ORDER BY ia.created_at DESC
            LIMIT 3
        `, [id]),

        // Vital signs
        query(`
            SELECT recorded_at, temperature, blood_pressure_systolic, blood_pressure_diastolic,
                   pulse_rate, spo2, weight, height, recorded_by
            FROM vital_signs
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 6
        `, [id]),

        // Complaints
        query(`
            SELECT created_at, complaint, recorded_by
            FROM complaints
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [id]),

        // Doctor's notes
        query(`
            SELECT created_at, note, recorded_by
            FROM doctors_notes
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 3
        `, [id]),

        // Nurse's notes
        query(`
            SELECT created_at, note, recorded_by
            FROM nurses_notes
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 3
        `, [id]),

        // Physical examinations
        query(`
            SELECT created_at, recorded_by, general_appearance, heent, cardiovascular,
                   respiration, gastrointestinal, gynecology_obstetrics, musculoskeletal,
                   neurological, skin, genitourinary, findings
            FROM physical_examinations
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 2
        `, [id]),

        // Lab tests
        query(`
            SELECT created_at, test_type, status, results, comments, prescribed_by
            FROM lab_tests
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [id]),

        // Diagnoses
        query(`
            SELECT diagnosis_date, condition, notes, recorded_by
            FROM diagnoses
            WHERE patient_id = $1
            ORDER BY diagnosis_date DESC
            LIMIT 5
        `, [id]),

        // Prescriptions with items
        query(`
            SELECT p.prescription_date, p.prescribed_by, p.status, p.notes,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'drug', pi.drug_name,
                               'dosage', pi.dosage,
                               'frequency', pi.frequency,
                               'duration', pi.duration
                           ) ORDER BY pi.prescription_item_id
                       ) FILTER (WHERE pi.prescription_item_id IS NOT NULL),
                       '[]'
                   ) AS items
            FROM prescriptions p
            LEFT JOIN prescription_items pi ON p.prescription_id = pi.prescription_id
            WHERE p.patient_id = $1
            GROUP BY p.prescription_id
            ORDER BY p.prescription_date DESC
            LIMIT 4
        `, [id]),

        // Procedures
        query(`
            SELECT performed_at, procedure_name, comments, recorded_by
            FROM procedures
            WHERE patient_id = $1
            ORDER BY performed_at DESC
            LIMIT 3
        `, [id]),

        // Discharge summaries
        query(`
            SELECT discharge_date_time, final_diagnosis, treatment_given,
                   outcome, condition, follow_up, recorded_by
            FROM discharge_summary
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 2
        `, [id]),

        // Patient visits
        query(`
            SELECT pv.check_in_time, pv.check_out_time, pv.visit_type, pv.purpose,
                   u.name AS doctor_name
            FROM patient_visits pv
            LEFT JOIN users u ON pv.doctor_id = u.id
            WHERE pv.patient_id = $1
            ORDER BY pv.check_in_time DESC
            LIMIT 3
        `, [id]),
    ]);

    return {
        patient: patientResult.rows[0] ?? null,
        admissions: admissionsResult.rows,
        vitalSigns: vitalsResult.rows,
        complaints: complaintsResult.rows,
        doctorNotes: doctorNotesResult.rows,
        nurseNotes: nurseNotesResult.rows,
        physicalExams: physicalExamsResult.rows,
        labTests: labTestsResult.rows,
        diagnoses: diagnosesResult.rows,
        prescriptions: prescriptionsResult.rows,
        procedures: proceduresResult.rows,
        dischargeSummaries: dischargeSummariesResult.rows,
        visits: visitsResult.rows,
    };
};

export const formatPatientSummaryData = (data) => {
    const lines = [];
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const val = (v) => (v !== null && v !== undefined && v !== '') ? v : null;

    const { patient, vitalSigns, complaints, doctorNotes, nurseNotes, physicalExams, labTests, diagnoses, prescriptions, procedures, dischargeSummaries, admissions, visits } = data;

    if (patient) {
        lines.push('=== PATIENT PROFILE ===');
        lines.push(`Name: ${patient.first_name} ${patient.surname}`);
        lines.push(`DOB: ${fmt(patient.date_of_birth)} | Sex: ${patient.sex}`);
        if (val(patient.allergies)) lines.push(`Allergies: ${patient.allergies}`);
        if (val(patient.past_medical_history)) lines.push(`Past Medical History: ${patient.past_medical_history}`);
        if (val(patient.drug_history)) lines.push(`Drug History: ${patient.drug_history}`);
        if (val(patient.family_history)) lines.push(`Family History: ${patient.family_history}`);
        if (val(patient.social_history)) lines.push(`Social History: ${patient.social_history}`);
    }

    if (vitalSigns.length) {
        lines.push('\n=== RECENT VITAL SIGNS (most recent first) ===');
        vitalSigns.forEach(v => {
            const bp = (v.blood_pressure_systolic && v.blood_pressure_diastolic)
                ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` : null;
            const parts = [
                `[${fmt(v.recorded_at)}]`,
                v.temperature ? `Temp: ${v.temperature}°C` : null,
                bp ? `BP: ${bp}` : null,
                v.pulse_rate ? `Pulse: ${v.pulse_rate} bpm` : null,
                v.spo2 ? `SpO2: ${v.spo2}%` : null,
                v.weight ? `Weight: ${v.weight}kg` : null,
                v.height ? `Height: ${v.height}cm` : null,
                v.recorded_by ? `By: ${v.recorded_by}` : null,
            ].filter(Boolean).join(' | ');
            lines.push(parts);
        });
    }

    if (complaints.length) {
        lines.push("\n=== RECENT COMPLAINTS (most recent first) ===");
        complaints.forEach(c => {
            lines.push(`[${fmt(c.created_at)}] "${c.complaint}" — By: ${c.recorded_by}`);
        });
    }

    if (diagnoses.length) {
        lines.push('\n=== RECENT DIAGNOSES (most recent first) ===');
        diagnoses.forEach(d => {
            const note = val(d.notes) ? ` — Notes: ${d.notes}` : '';
            lines.push(`[${fmt(d.diagnosis_date)}] ${d.condition}${note} — By: ${d.recorded_by}`);
        });
    }

    if (doctorNotes.length) {
        lines.push("\n=== RECENT DOCTOR'S NOTES (most recent first) ===");
        doctorNotes.forEach(n => {
            lines.push(`[${fmt(n.created_at)}] ${n.note} — By: ${n.recorded_by}`);
        });
    }

    if (nurseNotes.length) {
        lines.push("\n=== RECENT NURSE'S NOTES (most recent first) ===");
        nurseNotes.forEach(n => {
            lines.push(`[${fmt(n.created_at)}] ${n.note} — By: ${n.recorded_by}`);
        });
    }

    if (physicalExams.length) {
        lines.push('\n=== RECENT PHYSICAL EXAMINATIONS (most recent first) ===');
        physicalExams.forEach(e => {
            lines.push(`[${fmt(e.created_at)}] Recorded by: ${e.recorded_by}`);
            if (val(e.general_appearance)) lines.push(`  General Appearance: ${e.general_appearance}`);
            if (val(e.heent)) lines.push(`  HEENT: ${e.heent}`);
            if (val(e.cardiovascular)) lines.push(`  Cardiovascular: ${e.cardiovascular}`);
            if (val(e.respiration)) lines.push(`  Respiration: ${e.respiration}`);
            if (val(e.gastrointestinal)) lines.push(`  Gastrointestinal: ${e.gastrointestinal}`);
            if (val(e.gynecology_obstetrics)) lines.push(`  Gynecology/Obstetrics: ${e.gynecology_obstetrics}`);
            if (val(e.musculoskeletal)) lines.push(`  Musculoskeletal: ${e.musculoskeletal}`);
            if (val(e.neurological)) lines.push(`  Neurological: ${e.neurological}`);
            if (val(e.skin)) lines.push(`  Skin: ${e.skin}`);
            if (val(e.genitourinary)) lines.push(`  Genitourinary: ${e.genitourinary}`);
            if (val(e.findings)) lines.push(`  Findings/Provisional Diagnosis: ${e.findings}`);
        });
    }

    if (labTests.length) {
        lines.push('\n=== RECENT LAB TESTS (most recent first) ===');
        labTests.forEach(t => {
            const result = val(t.results) ? ` | Results: ${t.results}` : '';
            const comments = val(t.comments) ? ` | Comments: ${t.comments}` : '';
            lines.push(`[${fmt(t.created_at)}] ${t.test_type} — Status: ${t.status}${result}${comments} — By: ${t.prescribed_by}`);
        });
    }

    if (prescriptions.length) {
        lines.push('\n=== RECENT PRESCRIPTIONS (most recent first) ===');
        prescriptions.forEach(p => {
            lines.push(`[${fmt(p.prescription_date)}] Status: ${p.status || 'N/A'} — By: ${p.prescribed_by}`);
            if (val(p.notes)) lines.push(`  Notes: ${p.notes}`);
            if (p.items && p.items.length) {
                p.items.forEach(item => {
                    if (item.drug) {
                        lines.push(`  - ${item.drug} | Dosage: ${item.dosage || 'N/A'} | Frequency: ${item.frequency || 'N/A'} | Duration: ${item.duration || 'N/A'}`);
                    }
                });
            }
        });
    }

    if (procedures.length) {
        lines.push('\n=== RECENT PROCEDURES (most recent first) ===');
        procedures.forEach(p => {
            const comments = val(p.comments) ? ` — ${p.comments}` : '';
            lines.push(`[${fmt(p.performed_at)}] ${p.procedure_name}${comments} — By: ${p.recorded_by}`);
        });
    }

    if (admissions.length) {
        lines.push('\n=== RECENT ADMISSIONS (most recent first) ===');
        admissions.forEach(a => {
            lines.push(`[${fmt(a.admission_date)}] Doctor: ${a.doctor_name} | Discharge Condition: ${a.discharge_condition}${a.bed_group ? ` | Ward: ${a.bed_group}` : ''}`);
            if (a.symptom_types && a.symptom_types.length) lines.push(`  Symptoms: ${Array.isArray(a.symptom_types) ? a.symptom_types.join(', ') : a.symptom_types}`);
            if (val(a.symptom_description)) lines.push(`  Description: ${a.symptom_description}`);
            if (val(a.note)) lines.push(`  Note: ${a.note}`);
            lines.push(`  Discharge Date: ${a.end_date ? fmt(a.end_date) : 'Still admitted'}`);
        });
    }

    if (dischargeSummaries.length) {
        lines.push('\n=== RECENT DISCHARGE SUMMARIES (most recent first) ===');
        dischargeSummaries.forEach(d => {
            lines.push(`[${fmt(d.discharge_date_time)}] Final Diagnosis: ${d.final_diagnosis} | Outcome: ${d.outcome || 'N/A'} | Condition: ${d.condition || 'N/A'}`);
            if (val(d.treatment_given)) lines.push(`  Treatment Given: ${d.treatment_given}`);
            if (val(d.follow_up)) lines.push(`  Follow-up: ${d.follow_up}`);
        });
    }

    if (visits.length) {
        lines.push('\n=== RECENT VISITS (most recent first) ===');
        visits.forEach(v => {
            const checkout = v.check_out_time ? `Checked out: ${fmt(v.check_out_time)}` : 'Ongoing';
            lines.push(`[${fmt(v.check_in_time)}] ${v.visit_type} visit — Purpose: ${v.purpose || 'N/A'} — Doctor: ${v.doctor_name || 'N/A'} — ${checkout}`);
        });
    }

    return lines.join('\n');
};