import { transcribeSpeech } from '../services/generateTextFromSpeech.js';

export const transcribeSpeechController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'audio file is required' });
        }

        const result = await transcribeSpeech(req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error transcribing speech:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
