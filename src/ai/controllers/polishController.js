import { polishComplaint, polishDoctorNote, polishNurseNote, polishLabTestResult, generatePhysicalExamFindings, generatePatientSummary, generateLabTestComment } from '../services/generateText.js';
import { getPatientSummaryData, formatPatientSummaryData } from '../../services/summaryServices.js';
import { query } from '../../../drizzle-db.js';

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
        const { patientId, testType } = req.body;
        if (!patientId || !testType) {
            return res.status(400).json({ success: false, message: 'patientId and testType are required' });
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
            testType,
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
