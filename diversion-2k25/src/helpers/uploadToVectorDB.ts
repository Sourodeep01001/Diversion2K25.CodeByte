import * as fs from 'fs';
import { SourceFile } from './getAllSourceFiles';
import {  genAiModelProvider, qdrantClientProvider } from './clientProviders';
import {v4 as uuidv4} from 'uuid';

const model = genAiModelProvider;
const qdrant = qdrantClientProvider;
const collectionName = uuidv4().replace(/-/g, '').substring(0, 10);

async function getEmbedding(text: string) {
    try {
        const result = await model.embedContent(text);
        const embedding = result?.embedding?.values;
        return embedding;
    } catch (error) {
        console.error('Error getting embedding:', error);
        throw error;
    }
}


async function initializeQdrant() {
    try {
        const collections = await qdrant.getCollections();
        const collectionExists = collections.collections.some(c => c.name === collectionName);

        if (!collectionExists) {
            console.log(`Creating collection: ${collectionName}`);
            await qdrant.createCollection(collectionName, {
                vectors: {
                    size: 768, // Dimension for Gemini embeddings
                    distance: 'Cosine'
                }
            });
        }
        console.log('Successfully connected to Qdrant');
    } catch (error) {
        console.error('Error initializing Qdrant:', error);
        throw error;
    }
}

const CHUNK_SIZE = 8000; 

async function getChunkedEmbeddings(text: string): Promise<number[]> {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.substring(i, i + CHUNK_SIZE));
    }

    const allEmbeddings: number[][] = [];
    for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        if (embedding) {
            allEmbeddings.push(embedding);
        }
    }

    // Average all embeddings to maintain 768 dimensions
    const finalEmbedding = new Array(768).fill(0);
    for (const embedding of allEmbeddings) {
        for (let i = 0; i < 768; i++) {
            finalEmbedding[i] += embedding[i];
        }
    }

    // Divide by number of chunks to get average
    if (allEmbeddings.length > 0) {
        for (let i = 0; i < 768; i++) {
            finalEmbedding[i] /= allEmbeddings.length;
        }
    }

    return finalEmbedding;
}

export async function uploadToVectorDB(files: SourceFile[]): Promise<string> {
    try {
        await initializeQdrant();

        // Process files in batches
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(files.length/batchSize)}`);
            
            const points = await Promise.all(
                batch.map(async (file) => {
                    const content = fs.readFileSync(file.path, 'utf-8');
                    const embedding = await getChunkedEmbeddings(content);

                    // Validate embedding
                    if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
                        console.error('Invalid embedding:', embedding);
                        throw new Error('Invalid embedding dimensions');
                    }
                    const id = crypto.randomUUID();
                    return {
                        id: id, // Unique ID per user and file
                        vector: embedding,
                        payload: {
                            path: file.path,
                            content: content,// Add user ID to metadata
                        }
                    };
                })
            );

             // Log points before upsert
             console.log('Points before upsert:');
             points.forEach(point => {
                 console.log('Point ID:', point.id, typeof point.id);
                 console.log('Point Vector:', point.vector, typeof point.vector);
                 console.log('Point Payload:', point.payload, typeof point.payload);
             });

            try {
                await qdrant.upsert(collectionName, { points });
                console.log(`Successfully uploaded batch ${Math.floor(i/batchSize) + 1}`);
            } catch (error) {
                console.error(`Error uploading batch ${Math.floor(i/batchSize) + 1}:`, error);
                throw error;
            }
        }

        console.log(`Successfully uploaded ${files.length} files to Qdrant for user`);
    } catch (error) {
        console.error('Error uploading to vector DB:', error);
        throw error;
    }
    return collectionName;
}

