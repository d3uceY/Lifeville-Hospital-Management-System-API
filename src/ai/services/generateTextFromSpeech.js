import Groq from "groq-sdk";
import config from "../../constants/config";

const groq = new Groq({ apiKey: config.ai.groqApiKey });

const models = ["whisper-large-v3-turbo", "whisper-large-v3"];

// omo, i can explain, i am doing this for 2 reasons: 😂
// to avoid rate limits on one model
// and it's funny
const russianRoulette = () => {
    return models[Math.floor(Math.random() * models.length)];
};

export async function transcribeSpeech(req) {
    const formData = await req.formData();
    const file = formData.get("audio");

    const transcription = await groq.audio.transcriptions.create({
        file,
        model: russianRoulette(),
    });

    return { text: transcription.text };
}