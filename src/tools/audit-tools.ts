// src/tools/audit-tools.ts

import { Tool } from "@mastra/core/tool";
import { z } from "zod";
import { AppMetadata, AuditDimension, Recommendation } from "@/types/aso-types";

// Helper function to score title
function scoreTitle(app: AppMetadata): {
  score: number;
  checks: string[];
  recommendations: Recommendation[];
} {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  // Check length
  const titleLength = app.title.length;
  if (titleLength <= 30) {
    checks.push("✅ Title within 30 character limit");
    score += 3;
  } else {
    checks.push("❌ Title exceeds 30 character limit");
    recommendations.push({
      type: "high-impact",
      priority: 1,
      title: "Shorten title to 30 characters",
      description: "Apple enforces a 30-character limit for titles.",
      evidence: `Current title length: ${titleLength} characters`,
      beforeExample: app.title,
      afterExample: app.title.substring(0, 30),
      impact: "High",
      effort: "medium",
    });
  }

  // Check for keywords
  const commonKeywords = ["music", "podcast", "audio", "stream", "listen"];
  const foundKeywords = commonKeywords.filter((k) =>
    app.title.toLowerCase().includes(k),
  );
  const keywordScore = Math.min(foundKeywords.length / 2, 1);
  score += keywordScore * 3;
  checks.push(`✅ Found ${foundKeywords.length} primary keywords in title`);

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreSubtitle(app: AppMetadata): {
  score: number;
  checks: string[];
  recommendations: Recommendation[];
} {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  if (!app.subtitle) {
    checks.push("❌ Subtitle missing");
    recommendations.push({
      type: "quick-win",
      priority: 1,
      title: "Add a subtitle",
      description: "Use the 30 characters to highlight key benefits.",
      evidence: "Subtitle field is empty",
      afterExample: "Discover millions of songs. Listen free.",
      impact: "High",
      effort: "low",
    });
    return { score: 0, checks, recommendations };
  }

  const subtitleLength = app.subtitle.length;
  if (subtitleLength > 30) {
    checks.push("❌ Subtitle exceeds 30 characters");
    score += 0;
  } else if (subtitleLength > 20) {
    checks.push("✅ Good character utilization");
    score += 2;
  } else {
    checks.push("⚠️ Subtitle underutilized");
    score += 1;
  }

  // Check for benefit framing
  const benefits = ["discover", "listen", "stream", "free", "download"];
  const hasBenefit = benefits.some((b) =>
    app.subtitle.toLowerCase().includes(b),
  );
  if (hasBenefit) {
    checks.push("✅ Benefit-driven subtitle");
    score += 3;
  } else {
    checks.push("⚠️ Subtitle lacks benefit framing");
    score += 1;
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

export const performAuditTool = new Tool({
  name: "performASOAudit",
  description: "Perform a comprehensive ASO audit on an app",
  parameters: z.object({
    appMetadata: z.any(),
  }),
  execute: async ({ appMetadata }: { appMetadata: AppMetadata }) => {
    const dimensions: AuditDimension[] = [];
    const allRecommendations: Recommendation[] = [];

    // Audit each dimension
    const titleAudit = scoreTitle(appMetadata);
    const subtitleAudit = scoreSubtitle(appMetadata);

    dimensions.push({
      name: "Title",
      score: titleAudit.score,
      maxScore: 10,
      weight: 20,
      checks: titleAudit.checks,
      details: "Title optimization for keywords and readability",
      recommendations: titleAudit.recommendations,
    });

    dimensions.push({
      name: "Subtitle",
      score: subtitleAudit.score,
      maxScore: 10,
      weight: 15,
      checks: subtitleAudit.checks,
      details: "Subtitle for benefits and secondary keywords",
      recommendations: subtitleAudit.recommendations,
    });

    allRecommendations.push(
      ...titleAudit.recommendations,
      ...subtitleAudit.recommendations,
    );

    // Calculate overall score
    const weightedScore = dimensions.reduce(
      (acc, d) => acc + (d.score / d.maxScore) * d.weight,
      0,
    );
    const overallScore = Math.round(weightedScore);

    return {
      dimensions,
      overallScore,
      quickWins: allRecommendations
        .filter((r) => r.type === "quick-win")
        .slice(0, 5),
      highImpactChanges: allRecommendations
        .filter((r) => r.type === "high-impact")
        .slice(0, 5),
      strategicRecommendations: allRecommendations
        .filter((r) => r.type === "strategic")
        .slice(0, 5),
      competitorComparison: [],
    };
  },
});
