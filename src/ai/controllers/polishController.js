import { polishComplaint, polishDoctorNote, polishNurseNote } from '../services/generateText.js';

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
