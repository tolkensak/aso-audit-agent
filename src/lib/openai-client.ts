// src/lib/openai-client.ts

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1",
});

export async function generateAIResponse(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
) {
    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "llama-3.3-70b-versatile", // Updated default
            messages: [
                {
                    role: "system",
                    content: `You are an expert ASO (App Store Optimization) consultant. Help users audit their app store listings.
          When a user provides an App Store URL, you should:
          1. Acknowledge the URL
          2. Scrape the app metadata (the system will do this)
          3. Present the app name, developer, and category
          4. Ask for confirmation
          5. Run the audit and present results
          Be conversational, helpful, and professional.`,
                },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });

        return (
            response.choices[0]?.message?.content ||
            "I apologize, but I could not generate a response."
        );
    } catch (error) {
        console.error("OpenAI API error:", error);
        throw new Error(
            `Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
}
