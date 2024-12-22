import OpenAI from "openai";
import { DataAPIClient } from "@datastax/astra-db-ts";

// Extract environment variables
const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
} = process.env;

// Check for missing environment variables
if (
    !ASTRA_DB_NAMESPACE ||
    !ASTRA_DB_COLLECTION ||
    !ASTRA_DB_API_ENDPOINT ||
    !ASTRA_DB_APPLICATION_TOKEN ||
    !OPENAI_API_KEY
) {
    throw new Error("Missing one or more required environment variables.");
}

// Initialize OpenAI and Astra DB clients
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Replace '*' with your domain for production
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// OPTIONS handler
export async function OPTIONS() {
    console.log("OPTIONS request received.");
    return new Response(null, { headers: corsHeaders });
}

// POST handler
export async function POST(req) {
    try {
        console.log("POST request received.");
        
        // Parse request body
        const body = await req.json();
        console.log("Parsed request body:", body);

        const { messages } = body;
        if (!messages || messages.length === 0) {
            throw new Error("No messages provided.");
        }

        const latestMessage = messages[messages.length - 1]?.content;
        console.log("Latest message content:", latestMessage);

        if (!latestMessage) {
            throw new Error("Latest message content is empty.");
        }

        let docContext = "";
        try {
            // Generate embedding from OpenAI
            console.log("Generating embedding...");
            const embedding = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: latestMessage,
            });
            console.log("Embedding generated successfully.");

            // Query Astra DB
            console.log("Querying Astra DB...");
            const collection = await db.collection(ASTRA_DB_COLLECTION);
            console.log("Connected to collection:", ASTRA_DB_COLLECTION);

            const cursor = await collection.find(null, {
                sort: { $vector: embedding.data[0].embedding }, // Validate Astra DB compatibility
                limit: 10,
            });
            const documents = await cursor.toArray();
            console.log("Documents retrieved:", documents);

            docContext = JSON.stringify(documents?.map((doc) => doc.text));
        } catch (dbError) {
            console.error("Database query error:", dbError);
            docContext = "Database context not available.";
        }

        // Truncate doc context for prompt
        const truncatedDocContext =
            docContext.length > 1000
                ? docContext.substring(0, 1000) + "..."
                : docContext;
        console.log("Document context:", truncatedDocContext);

        const template = {
            role: "system",
            content: `You are an AI assistant who knows everything about the Premier League.\n\n` +
                `Format responses using markdown where applicable and don't return images.\n\n` +
                `QUESTION: ${latestMessage}\n-------------`,
        };

        // Generate chat completion
        console.log("Generating chat response...");
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: false, // Temporarily set to false for debugging
            messages: [template, ...messages],
        });
        console.log("Chat response generated successfully.");

        return new Response(JSON.stringify(response), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
            },
        });
    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            { status: 500, headers: corsHeaders }
        );
    }
}
