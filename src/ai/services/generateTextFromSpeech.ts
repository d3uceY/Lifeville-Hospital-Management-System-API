import Groq from "groq-sdk";
import config from "../../constants/config.js";

let _groq: Groq | null = null;
function getGroq(): Groq {
    if (!_groq) _groq = new Groq({ apiKey: config.ai.groqApiKey });
    return _groq;
}

const models = ["whisper-large-v3-turbo", "whisper-large-v3"];
// omo, i can explain, i am doing this for 2 reasons: 😂
// to avoid rate limits on one model
// and it's funny
const russianRoulette = () => {
    return models[Math.floor(Math.random() * models.length)];
};

export async function transcribeSpeech(fileBuffer: Buffer, originalname: string, mimetype: string): Promise<{ text: string }> {
    const file = new File([fileBuffer as unknown as BlobPart], originalname, { type: mimetype });

    const transcription = await getGroq().audio.transcriptions.create({
        file,
        model: russianRoulette(),
    });

    return { text: transcription.text };
}