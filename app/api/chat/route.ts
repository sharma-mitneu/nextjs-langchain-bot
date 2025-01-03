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

// const corsHeaders = {
//     "Access-Control-Allow-Origin": "*", // Replace '*' with your domain for production
//     "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//     "Access-Control-Allow-Headers": "Content-Type",
// };

// // OPTIONS handler
// export async function OPTIONS() {
//     console.log("OPTIONS request received.");
//     return new Response(null, { headers: corsHeaders });
// }

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
                model: "text-embedding-3-small",
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
            content: `You are an AI assistant who knows everything about the Premier League.
            Use the below context to argument what you know about Premier League Football. The context
            will provide you with the most recent data from wikipedia, the official EPL website and others.
            If the context doesn't include the information you need answer based on your existing knowledge and 
            don't mention tge source of information or what the context does or doesn't include.
            Format responses using markdown where applicable and don't reutnr images.
            -------------
            START CONTEXT
            ${truncatedDocContext}
            END CONTEXT
            -------------
            QUESTION: ${latestMessage}
            -------------
            `
        }

        // Generate chat completion
        console.log("Generating chat response...");
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: false, // Temporarily set to false for debugging
            messages: [template, ...messages],
        });
        console.log("Chat response generated successfully." + response.choices[0].message.content);

        //return response.choices[0].message.content
        return new Response(
            JSON.stringify({
                choices: response.choices[0].message.content, // Return as-is to the frontend
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                },
            }
        );
    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            { status: 500, headers: {"Content-Type": "application/json"} }
        );
    }
}
