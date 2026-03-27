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

/**
 * Polishes raw EMR text for a given feature type.
 * @param {'complaint' | 'doctorNote' | 'nurseNote'} type
 * @param {string} rawText
 * @returns {Promise<string>} polished text
 */
export const polishText = async (type, rawText) => {
    const config = polishConfig[type];
    if (!config) throw new Error(`Unknown polish type: "${type}"`);

    const { text } = await generateText({
        model: groq(getModel('polish')),
        system: config.system,
        prompt: config.prompt(rawText),
    });

    return text;
};
