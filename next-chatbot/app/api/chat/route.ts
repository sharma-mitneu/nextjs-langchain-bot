import OpenAI from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";

const { ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OPENAI_API_KEY } = process.env;

if (!ASTRA_DB_NAMESPACE || !ASTRA_DB_COLLECTION || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_APPLICATION_TOKEN || !OPENAI_API_KEY) {
    throw new Error("Missing one or more required environment variables.");
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// Define CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Replace '*' with a specific domain if needed
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
    return new Response(null, {
        headers: corsHeaders,
    });
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const latestMessage = messages[messages?.length - 1]?.content;

        let docContext = "";

        // Generate embedding using OpenAI
        const embedding = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: latestMessage,
            encoding_format: "float",
        });

        // Query Astra DB for relevant documents
        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION);
            const cursor = await collection.find(null, {
                sort: { $vector: embedding.data[0].embedding },
                limit: 10,
            });

            const documents = await cursor.toArray();
            docContext = JSON.stringify(documents?.map((doc) => doc.text));
        } catch (err) {
            console.error("Error querying database:", err);
            docContext = "Database context not available.";
        }

        // Truncate document context if it's too long
        const truncatedDocContext = docContext.length > 1000
            ? docContext.substring(0, 1000) + "..."
            : docContext;

        // Build the template for the AI assistant
        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about the Premier League.

            Format responses using markdown where applicable and don't return images.
            
            QUESTION: ${latestMessage},
            -------------
        `
        };

        // Generate a chat completion using OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            messages: [template, ...messages],
        });

        // Return the response with CORS headers
        return new Response(response.body, {
            headers: {
                "Content-Type": "text/event-stream",
                ...corsHeaders,
            },
        });
    } catch (err) {
        console.error("Error processing request:", err);
        return new Response("Internal Server Error", {
            status: 500,
            headers: corsHeaders,
        });
    }
}
