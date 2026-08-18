// src/app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { scrapeAppStore } from '@/lib/scraper';
import { performAudit } from '@/lib/audit-engine';
import { generateAIResponse } from '@/lib/openai-client';
import { ChatMessage, AuditResult } from '@/types/aso-types';

interface SessionState {
  step: 'idle' | 'scraping' | 'confirming' | 'auditing' | 'complete';
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
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const sessionId = conversationId || uuidv4();
    let session = sessions.get(sessionId);

    if (!session) {
      session = { step: 'idle' };
      sessions.set(sessionId, session);
    }

    // Check if message contains an App Store URL
    const urlMatch = message.match(/https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[^\/]+\/id\d+/);
    let aiResponse = '';
    let parsedData = null;

    if (urlMatch && session.step === 'idle') {
      const url = urlMatch[0];
      session.appUrl = url;
      session.step = 'scraping';

      try {
        // Scrape app metadata
        const appData = await scrapeAppStore(url);
        session.appMetadata = appData;

        // Generate confirmation response
        aiResponse = `I found this app in the App Store:

📱 **${appData.name}**
👨‍💻 Developer: ${appData.developer}
📂 Category: ${appData.category}
🌍 Country: ${appData.country.toUpperCase()}
⭐ Rating: ${appData.rating.toFixed(1)}/5 (${appData.reviewCount} reviews)

**Is this the app you meant to audit?**`;

        session.step = 'confirming';
      } catch (error) {
        aiResponse = `I couldn't fetch the app details. Please make sure the URL is correct and try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
        session.step = 'idle';
      }
    } else if (session.step === 'confirming' && ['yes', 'yep', 'yeah', 'correct', 'that\'s it', 'that is it', 'confirm', 'proceed'].some(word => message.toLowerCase().includes(word))) {
      // User confirmed - run the audit
      if (!session.appMetadata) {
        aiResponse = 'I\'m sorry, I don\'t have the app data. Please paste the URL again.';
        session.step = 'idle';
      } else {
        session.step = 'auditing';
        
        // Run the audit
        const auditResult = performAudit(session.appMetadata);
        session.auditResult = auditResult;

        // Format the audit results for display
        const scoreColor = auditResult.overallScore >= 80 ? '🟢' : auditResult.overallScore >= 60 ? '🟡' : '🔴';
        const scoreEmoji = auditResult.overallScore >= 80 ? 'Excellent!' : auditResult.overallScore >= 60 ? 'Good, but room for improvement.' : 'Needs significant work.';

        let dimensionScores = '';
        auditResult.dimensions.forEach(d => {
          const bar = '█'.repeat(Math.round(d.score)) + '░'.repeat(10 - Math.round(d.score));
          dimensionScores += `\n   ${d.name}: ${d.score}/10 ${bar}`;
        });

        let quickWinsText = '';
        if (auditResult.quickWins.length > 0) {
          quickWinsText = '\n\n**🚀 Quick Wins (High Impact, Low Effort):**\n';
          auditResult.quickWins.slice(0, 3).forEach((rec, i) => {
            quickWinsText += `\n${i+1}. **${rec.title}**\n   ${rec.description}`;
            if (rec.beforeExample) {
              quickWinsText += `\n   ❌ Before: "${rec.beforeExample}"`;
            }
            if (rec.afterExample) {
              quickWinsText += `\n   ✅ After: "${rec.afterExample}"`;
            }
          });
        }

        let highImpactText = '';
        if (auditResult.highImpactChanges.length > 0) {
          highImpactText = '\n\n**💪 High-Impact Changes (Require More Effort):**\n';
          auditResult.highImpactChanges.slice(0, 3).forEach((rec, i) => {
            highImpactText += `\n${i+1}. **${rec.title}**\n   ${rec.description}\n   📊 Evidence: ${rec.evidence}`;
          });
        }

        aiResponse = `# 📊 ASO Audit Complete!

## Overall Score: ${auditResult.overallScore}/100 ${scoreEmoji}

### Dimension Scores:${dimensionScores}

${quickWinsText}
${highImpactText}

**💡 Strategic Recommendations:**
${auditResult.strategicRecommendations.length > 0 ? auditResult.strategicRecommendations.slice(0, 2).map((rec, i) => `\n${i+1}. **${rec.title}**\n   ${rec.description}`).join('\n') : '\n   (No strategic recommendations at this time)'}

Would you like to dive deeper into any specific dimension?`;

        session.step = 'complete';
      }
    } else if (session.step === 'confirming') {
      // User didn't confirm or said no
      aiResponse = `No problem! Please paste the correct App Store URL when you're ready, or type "help" for assistance.`;
      session.step = 'idle';
    } else if (session.step === 'complete' && message.toLowerCase().includes('help')) {
      aiResponse = `I can help you with:
• Paste an App Store URL to start an ASO audit
• Ask about specific ASO dimensions (Title, Subtitle, Keywords, etc.)
• Get recommendations for improving your app listing

Try pasting a URL like: https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580`;
    } else if (session.step === 'complete') {
      // Continue conversation about the audit
      const context = `The user just completed an ASO audit. Their app is "${session.appMetadata?.name}". 
      The overall score was ${session.auditResult?.overallScore}/100.
      Respond to their question: "${message}"`;
      
      aiResponse = await generateAIResponse([
        { role: 'user', content: context }
      ]);
    } else {
      // Default response using AI
      aiResponse = await generateAIResponse([
        { role: 'user', content: message }
      ]);
    }

    // Store the assistant response
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      auditResult: session.auditResult,
    };

    // Clean up old sessions (keep last 100)
    if (sessions.size > 100) {
      const keys = Array.from(sessions.keys());
      for (let i = 0; i < keys.length - 100; i++) {
        sessions.delete(keys[i]);
      }
    }

    return NextResponse.json({
      message: aiResponse,
      conversationId: sessionId,
      auditResult: session.auditResult,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process chat message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
