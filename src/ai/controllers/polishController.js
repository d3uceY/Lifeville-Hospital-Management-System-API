import { polishComplaint, polishDoctorNote, polishNurseNote, polishLabTestResult, generatePhysicalExamFindings, generatePatientSummary, generateLabTestComment, generateDiagnosisSuggestion } from '../services/generateText.js';
import { getPatientSummaryData, formatPatientSummaryData } from '../../services/summaryServices.js';
import { query } from '../../../drizzle-db.js';
import { lookupByCode } from '../../icd/services/icd.services.js';

const summaryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export const polishComplaintText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'text is required' });
        const polished = await polishComplaint(text);
        res.json({ success: true, polished });
    } catch (error) {
        console.error('Error polishing complaint:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const polishDoctorNoteText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'text is required' });
        const polished = await polishDoctorNote(text);
        res.json({ success: true, polished });
    } catch (error) {
        console.error('Error polishing doctor note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const polishNurseNoteText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'text is required' });
        const polished = await polishNurseNote(text);
        res.json({ success: true, polished });
    } catch (error) {
        console.error('Error polishing nurse note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const polishLabTestResultText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ success: false, message: 'text is required' });
        const polished = await polishLabTestResult(text);
        res.json({ success: true, polished });
    } catch (error) {
        console.error('Error polishing lab test result:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const generatePhysicalExamFindingsText = async (req, res) => {
    try {
        const { examData } = req.body;
        if (!examData || typeof examData !== 'object' || Array.isArray(examData)) {
            return res.status(400).json({ success: false, message: 'examData object is required' });
        }
        const polished = await generatePhysicalExamFindings(examData);
        res.json({ success: true, polished });
    } catch (error) {
        console.error('Error generating physical exam findings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const generateLabTestCommentText = async (req, res) => {
    try {
        const { patientId, testType, testTypes } = req.body;
        // Accept testTypes (array) or legacy testType (string)
        const testsArray = testTypes
            ? (Array.isArray(testTypes) ? testTypes : [testTypes])
            : (testType ? (Array.isArray(testType) ? testType : [testType]) : null);
        if (!patientId || !testsArray || testsArray.length === 0) {
            return res.status(400).json({ success: false, message: 'patientId and testTypes are required' });
        }

        const examResult = await query(`
            SELECT created_at, general_appearance, heent, cardiovascular, respiration,
                   gastrointestinal, gynecology_obstetrics, musculoskeletal, neurological,
                   skin, genitourinary, findings
            FROM physical_examinations
            WHERE patient_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `, [Number(patientId)]);

        if (!examResult.rows.length) {
            return res.status(404).json({ success: false, message: 'No physical examination found for this patient' });
        }

        const exam = examResult.rows[0];
        const examDate = new Date(exam.created_at);
        const daysSinceExam = Math.floor((Date.now() - examDate.getTime()) / (1000 * 60 * 60 * 24));
        const examDateFormatted = examDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const LABELS = {
            general_appearance: 'General Appearance',
            heent: 'HEENT',
            cardiovascular: 'Cardiovascular',
            respiration: 'Respiration',
            gastrointestinal: 'Gastrointestinal',
            gynecology_obstetrics: 'Gynecology / Obstetrics',
            musculoskeletal: 'Musculoskeletal',
            neurological: 'Neurological',
            skin: 'Skin',
            genitourinary: 'Genitourinary',
            findings: 'Findings / Provisional Diagnosis',
        };

        const examFindings = Object.entries(LABELS)
            .filter(([key]) => exam[key] && String(exam[key]).trim())
            .map(([key, label]) => `${label}: ${exam[key]}`)
            .join('\n');

        if (!examFindings) {
            return res.status(422).json({ success: false, message: 'Physical examination has no recorded findings' });
        }

        const comment = await generateLabTestComment({
            testTypes: testsArray,
            examDate: examDateFormatted,
            daysSinceExam,
            examFindings,
        });

        res.json({ success: true, comment });
    } catch (error) {
        console.error('Error generating lab test comment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getCachedPatientSummary = async (req, res) => {
    try {
        const { patientId } = req.params;
        const cached = summaryCache.get(String(patientId));
        if (cached && (Date.now() - cached.generatedAt) < CACHE_TTL_MS) {
            return res.json({
                success: true,
                summary: cached.summary,
                cached: true,
                generatedAt: new Date(cached.generatedAt).toISOString(),
                expiresIn: Math.floor((CACHE_TTL_MS - (Date.now() - cached.generatedAt)) / 1000),
            });
        }
        return res.json({ success: true, summary: null });
    } catch (error) {
        console.error('Error checking AI patient summary cache:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAIPatientSummary = async (req, res) => {
    try {
        const { patientId } = req.params;

        const cached = summaryCache.get(String(patientId));
        if (cached && (Date.now() - cached.generatedAt) < CACHE_TTL_MS) {
            return res.json({
                success: true,
                summary: cached.summary,
                cached: true,
                generatedAt: new Date(cached.generatedAt).toISOString(),
                expiresIn: Math.floor((CACHE_TTL_MS - (Date.now() - cached.generatedAt)) / 1000),
            });
        }

        const data = await getPatientSummaryData(patientId);
        const formattedData = formatPatientSummaryData(data);
        const summary = await generatePatientSummary(formattedData);

        const now = Date.now();
        summaryCache.set(String(patientId), { summary, generatedAt: now });
        setTimeout(() => summaryCache.delete(String(patientId)), CACHE_TTL_MS);

        res.json({
            success: true,
            summary,
            cached: false,
            generatedAt: new Date(now).toISOString(),
            expiresIn: Math.floor(CACHE_TTL_MS / 1000),
        });
    } catch (error) {
        console.error('Error generating AI patient summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPatientContext(patient) {
    const parts = [];
    if (patient.sex) parts.push(`Sex: ${patient.sex}`);
    if (patient.date_of_birth) {
        const age = Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        parts.push(`Age: ${age} years`);
    }
    if (patient.past_medical_history) parts.push(`Past Medical History: ${patient.past_medical_history}`);
    if (patient.allergies) parts.push(`Allergies: ${patient.allergies}`);
    if (patient.drug_history) parts.push(`Drug History: ${patient.drug_history}`);
    if (patient.family_history) parts.push(`Family History: ${patient.family_history}`);
    if (patient.social_history) parts.push(`Social History: ${patient.social_history}`);
    return parts.join('\n') || null;
}

/** Converts a dot-free ICD code (e.g. J189) to dotted form (J18.9) for lookup fallback */
function toDottedCode(code) {
    const c = code.toUpperCase();
    return c.length > 3 ? `${c.slice(0, 3)}.${c.slice(3)}` : c;
}

export const generateDiagnosisSuggestionText = async (req, res) => {
    try {
        const { patientId, formNotes } = req.body;
        if (!patientId) return res.status(400).json({ success: false, message: 'patientId is required' });

        // Fetch all clinical data in parallel
        const [patientResult, examResult, doctorNoteResult, complaintsResult, vitalsResult] = await Promise.all([
            query(
                `SELECT sex, date_of_birth, past_medical_history, allergies, drug_history, family_history, social_history
                 FROM patients WHERE patient_id = $1`,
                [Number(patientId)]
            ),
            query(
                `SELECT findings, general_appearance, heent, cardiovascular, respiration,
                        gastrointestinal, neurological, musculoskeletal, skin, genitourinary
                 FROM physical_examinations WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [Number(patientId)]
            ),
            query(
                `SELECT note FROM doctors_notes WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [Number(patientId)]
            ),
            query(
                `SELECT complaint FROM complaints WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 3`,
                [Number(patientId)]
            ),
            query(
                `SELECT temperature, blood_pressure_systolic, blood_pressure_diastolic, pulse_rate, spo2, weight, height
                 FROM vital_signs WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [Number(patientId)]
            ),
        ]);

        const patient = patientResult.rows[0] ?? null;
        const exam = examResult.rows[0] ?? null;

        // Extract ICD codes from physical exam findings.
        // The AI may return dotted codes (J20.9) or dot-free (J189) — handle both.
        const suggestedCondition = {};
        if (exam?.findings) {
            // Match codes in parentheses: letter + digit + any mix of digits, dots, letters
            const codeMatches = [...exam.findings.matchAll(/\(([A-Za-z]\d[\d.a-zA-Z]*)\)/g)];
            const uniqueCodes = [...new Set(codeMatches.map(m => m[1].toUpperCase()))];
            for (const raw of uniqueCodes) {
                const noDot = raw.replace('.', '');
                // Try: dot-free first, then dotted (dot after pos 3), then original as-is
                const entry = lookupByCode(noDot) ?? lookupByCode(toDottedCode(noDot)) ?? lookupByCode(raw);
                if (entry) {
                    suggestedCondition[entry.code] = entry.description;
                }
            }
        }

        // Build context strings
        const patientContext = patient ? buildPatientContext(patient) : null;

        const vs = vitalsResult.rows[0] ?? null;
        const vitalSigns = vs
            ? `Temp: ${vs.temperature ?? '—'}°C, BP: ${vs.blood_pressure_systolic ?? '—'}/${vs.blood_pressure_diastolic ?? '—'} mmHg, Pulse: ${vs.pulse_rate ?? '—'} bpm, SpO2: ${vs.spo2 ?? '—'}%`
            : null;

        const complaints = complaintsResult.rows.length
            ? complaintsResult.rows.map(c => `- ${c.complaint}`).join('\n')
            : null;

        const EXAM_LABELS = {
            general_appearance: 'General Appearance',
            heent: 'HEENT',
            cardiovascular: 'Cardiovascular',
            respiration: 'Respiration',
            gastrointestinal: 'Gastrointestinal',
            neurological: 'Neurological',
            musculoskeletal: 'Musculoskeletal',
            skin: 'Skin',
            genitourinary: 'Genitourinary',
        };
        const physicalExamFindings = exam
            ? Object.entries(EXAM_LABELS)
                .filter(([key]) => exam[key]?.trim())
                .map(([key, label]) => `${label}: ${exam[key]}`)
                .concat(exam.findings ? [`Findings: ${exam.findings}`] : [])
                .join('\n') || null
            : null;

        const latestDoctorNote = doctorNoteResult.rows[0]?.note ?? null;
        const identifiedDiagnoses = Object.entries(suggestedCondition).map(([code, description]) => ({ code, description }));

        if (!identifiedDiagnoses.length && !physicalExamFindings && !complaints && !vitalSigns) {
            return res.status(422).json({ success: false, message: 'Insufficient clinical data found for this patient' });
        }

        const suggestedNotes = await generateDiagnosisSuggestion({
            patientContext,
            identifiedDiagnoses,
            vitalSigns,
            complaints,
            physicalExamFindings,
            latestDoctorNote,
            formNotes: formNotes || null,
        });


        res.json({ success: true, suggestedCondition, suggestedNotes });
    } catch (error) {
        console.error('Error generating diagnosis suggestion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
