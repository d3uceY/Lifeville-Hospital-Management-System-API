import { polishComplaint, polishDoctorNote, polishNurseNote, generatePhysicalExamFindings, generatePatientSummary } from '../services/generateText.js';
import { getPatientSummaryData, formatPatientSummaryData } from '../../services/summaryServices.js';

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
