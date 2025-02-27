import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClientProvider = new QdrantClient({
    url: 'https://4e2a7319-58de-40d9-87de-23dbcadba7db.europe-west3-0.gcp.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwiZXhwIjoxNzQxMTM4ODU2fQ.ydEQIryMqnUuQXZNDVHkPURhp5scv3Y0yZBYCT_RaCE',
});

const genAI = new GoogleGenerativeAI('AIzaSyBUeElOjAV5ftfm2B0xtf3zJ-sNnE0Sq0w');
const genAiModelProvider = genAI.getGenerativeModel({ model: "text-embedding-004" });

export { qdrantClientProvider, genAiModelProvider };