import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_PROJECT_ID!;
const location = process.env.GOOGLE_LOCATION || 'us-central1';

// Vertex AI の初期化
export const vertexAI = new VertexAI({ project, location });

// Gemini-1.5-Flash モデルの取得（推奨）
export const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
    },
});
