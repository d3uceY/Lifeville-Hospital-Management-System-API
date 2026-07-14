import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { polishConfig } from '../prompts/polishConfig.js';

type AiTask = 'summary' | 'diagnosis' | 'autocomplete' | 'polish';

const getModel = (task: AiTask): string => {
    if (task === "summary" || task === "diagnosis") {
        return 'llama-3.3-70b-versatile';
    }
    if (task === "autocomplete") {
        return 'llama-4-scout-17b';
    }
    if (task === "polish") {
        return 'meta-llama/llama-4-scout-17b-16e-instruct';
    }
    return 'llama-3.3-70b-versatile';
};

const polish = async (type: string, rawText: string): Promise<string> => {
    const config = (polishConfig as Record<string, { system: string; prompt: (arg: unknown) => string }>)[type];
    const { text } = await generateText({
        model: groq(getModel('polish')),
        system: config.system,
        prompt: config.prompt(rawText),
    });
    return text;
};

const summarize = async (type: string, rawText: string): Promise<string> => {
    const config = (polishConfig as Record<string, { system: string; prompt: (arg: unknown) => string }>)[type];
    const { text } = await generateText({
        model: groq(getModel('summary')),
        system: config.system,
        prompt: config.prompt(rawText),
    });
    return text;
};

export const polishComplaint = (rawText: string) => polish('complaint', rawText);
export const polishDoctorNote = (rawText: string) => polish('doctorNote', rawText);
export const polishNurseNote = (rawText: string) => polish('nurseNote', rawText);
export const polishLabTestResult = (rawText: string) => summarize('labTestResult', rawText);
export const generatePhysicalExamFindings = (examFields: string) => summarize('physicalExamFindings', examFields);
export const generatePatientSummary = (formattedData: string) => summarize('patientSummary', formattedData);
export const generateLabTestComment = (data: string) => summarize('labTestComment', data);
export const generateDiagnosisSuggestion = (data: string) => summarize('diagnosisSuggestion', data);
