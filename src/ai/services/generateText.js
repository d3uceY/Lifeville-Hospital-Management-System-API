import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { polishConfig } from '../prompts/polishConfig.js';

const getModel = (task) => {
    if (task === "summary" || task === "diagnosis") {
        return 'llama-3.3-70b-versatile';
    }
    if (task === "autocomplete") {
        return 'llama-4-scout-17b';
    }
    if (task === "structured_json") {
        return 'qwen/qwen3-32b';
    }
    if (task === "polish") {
        return 'llama-3.3-70b-versatile';
    }
};

const polish = async (type, rawText) => {
    const config = polishConfig[type];
    const { text } = await generateText({
        model: groq(getModel('polish')),
        system: config.system,
        prompt: config.prompt(rawText),
    });
    return text;
};

const summarize = async (type, rawText) => {
    const config = polishConfig[type];
    const { text } = await generateText({
        model: groq(getModel('summary')),
        system: config.system,
        prompt: config.prompt(rawText),
    });
    return text;
};

export const polishComplaint = (rawText) => polish('complaint', rawText);
export const polishDoctorNote = (rawText) => polish('doctorNote', rawText);
export const polishNurseNote = (rawText) => polish('nurseNote', rawText);
export const polishLabTestResult = (rawText) => polish('labTestResult', rawText);
export const generatePhysicalExamFindings = (examFields) => polish('physicalExamFindings', examFields);
export const generatePatientSummary = (formattedData) => summarize('patientSummary', formattedData);
export const generateLabTestComment = (data) => summarize('labTestComment', data);
