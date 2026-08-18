// src/agents/chat-agent.ts

import { Agent } from "@mastra/core/agent";
import { scrapeAppStoreTool } from "@/tools/app-store-scraper";
import { performAuditTool } from "@/tools/audit-tools";

export const chatAgent = new Agent({
  name: "ASO Chat Agent",
  description: "Conversational agent for ASO audits",
  model: {
    provider: "openai",
    name: process.env.OPENAI_MODEL || "mixtral-8x7b-32768",
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1",
  },
  instructions: `You are an expert ASO (App Store Optimization) consultant. 
Your role is to help users audit their app store listings.

Follow this workflow:
1. When a user provides an App Store URL, use the scrapeAppStore tool to fetch metadata.
2. Present the app name, developer, icon, category, and country to the user.
3. Ask "Is this the app you meant?" and wait for confirmation.
4. Once confirmed, use the performAudit tool to run the full ASO audit.
5. Present results in a clear, structured format with scores and recommendations.

Be conversational, helpful, and professional. Always confirm the app before running the full audit.`,
  tools: [scrapeAppStoreTool, performAuditTool],
});
