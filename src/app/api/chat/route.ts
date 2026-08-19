// src/app/api/chat/route.ts

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { scrapeAppStore } from "@/lib/scraper";
import { performAudit } from "@/lib/audit-engine";
import { generateAIResponse } from "@/lib/openai-client";
import { ChatMessage, AuditResult } from "@/types/aso-types";

interface SessionState {
    step: "idle" | "scraping" | "confirming" | "auditing" | "complete";
    appUrl?: string;
    appMetadata?: any;
    auditResult?: AuditResult;
    lastUserMessage?: string;
}

const sessions = new Map<string, SessionState>();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, conversationId } = body;

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 },
            );
        }

        const sessionId = conversationId || uuidv4();
        let session = sessions.get(sessionId);

        if (!session) {
            session = { step: "idle" };
            sessions.set(sessionId, session);
        }

        // Check if message contains an App Store URL
        const urlMatch = message.match(
            /https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[^\/]+\/id\d+/,
        );
        let responseData: any = {
            type: "message",
            content: "",
            conversationId: sessionId,
        };

        if (urlMatch && session.step === "idle") {
            const url = urlMatch[0];
            session.appUrl = url;
            session.step = "scraping";

            try {
                const appData = await scrapeAppStore(url);
                session.appMetadata = appData;
                session.step = "confirming";

                // Return structured data for confirmation
                responseData = {
                    type: "confirmation",
                    conversationId: sessionId,
                    appData: {
                        name: appData.name,
                        developer: appData.developer,
                        category: appData.category,
                        country: appData.country.toUpperCase(),
                        rating: appData.rating,
                        reviewCount: appData.reviewCount,
                        icon: appData.icon,
                    },
                    message: `I found this app in the App Store. Is this the one you meant to audit?`,
                };
            } catch (error) {
                responseData = {
                    type: "error",
                    conversationId: sessionId,
                    message: `I couldn't fetch the app details. Please make sure the URL is correct and try again.`,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
                session.step = "idle";
            }
        } else if (
            session.step === "confirming" &&
            [
                "yes",
                "yep",
                "yeah",
                "correct",
                "that's it",
                "that is it",
                "confirm",
                "proceed",
            ].some((word) => message.toLowerCase().includes(word))
        ) {
            if (!session.appMetadata) {
                responseData = {
                    type: "error",
                    conversationId: sessionId,
                    message:
                        "I'm sorry, I don't have the app data. Please paste the URL again.",
                };
                session.step = "idle";
            } else {
                session.step = "auditing";
                const auditResult = performAudit(session.appMetadata);
                session.auditResult = auditResult;
                session.step = "complete";

                // Return full structured audit data
                responseData = {
                    type: "audit_complete",
                    conversationId: sessionId,
                    auditResult: auditResult,
                    summary: {
                        overallScore: auditResult.overallScore,
                        quickWinsCount: auditResult.quickWins.length,
                        highImpactCount: auditResult.highImpactChanges.length,
                        strategicCount:
                            auditResult.strategicRecommendations.length,
                    },
                };
            }
        } else if (session.step === "confirming") {
            responseData = {
                type: "message",
                conversationId: sessionId,
                message: `No problem! Please paste the correct App Store URL when you're ready, or type "help" for assistance.`,
            };
            session.step = "idle";
        } else if (
            session.step === "complete" &&
            message.toLowerCase().includes("help")
        ) {
            responseData = {
                type: "message",
                conversationId: sessionId,
                message: `I can help you with:
• Paste an App Store URL to start an ASO audit
• Ask about specific ASO dimensions (Title, Subtitle, Keywords, etc.)
• Get recommendations for improving your app listing

Try pasting a URL like: https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580`,
            };
        } else if (session.step === "complete" && session.auditResult) {
            // Handle follow-up questions
            const context = `The user just completed an ASO audit. Their app is "${session.appMetadata?.name}". 
      The overall score was ${session.auditResult?.overallScore}/100.
      Respond to their question: "${message}"`;

            const aiMessage = await generateAIResponse([
                { role: "user", content: context },
            ]);

            responseData = {
                type: "message",
                conversationId: sessionId,
                message: aiMessage,
            };
        } else {
            // Default response
            const aiMessage = await generateAIResponse([
                { role: "user", content: message },
            ]);

            responseData = {
                type: "message",
                conversationId: sessionId,
                message: aiMessage,
            };
        }

        // Clean up old sessions
        if (sessions.size > 100) {
            const keys = Array.from(sessions.keys());
            for (let i = 0; i < keys.length - 100; i++) {
                sessions.delete(keys[i]);
            }
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json(
            {
                type: "error",
                error: error instanceof Error ? error.message : "Unknown error",
                message: "Failed to process chat message. Please try again.",
            },
            { status: 500 },
        );
    }
}
