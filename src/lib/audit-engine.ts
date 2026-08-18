// src/lib/audit-engine.ts

import { AppMetadata, AuditDimension, Recommendation, AuditResult } from '@/types/aso-types';

function scoreTitle(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  const titleLength = app.title.length;
  if (titleLength <= 30) {
    checks.push('✅ Title within 30 character limit');
    score += 3;
  } else {
    checks.push('❌ Title exceeds 30 character limit');
    recommendations.push({
      type: 'high-impact',
      priority: 1,
      title: 'Shorten title to 30 characters',
      description: 'Apple enforces a 30-character limit for titles. Your current title exceeds this limit.',
      evidence: `Current title length: ${titleLength} characters`,
      beforeExample: app.title,
      afterExample: app.title.substring(0, 30),
      impact: 'High - This is a requirement, not optional',
      effort: 'medium',
    });
  }

  const keywords = ['music', 'podcast', 'audio', 'stream', 'listen', 'learn', 'meditate', 'sleep'];
  const foundKeywords = keywords.filter(k => app.title.toLowerCase().includes(k));
  const keywordScore = Math.min(foundKeywords.length / 2, 1);
  score += keywordScore * 3;
  checks.push(`✅ Found ${foundKeywords.length} primary keywords in title`);

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreSubtitle(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  if (!app.subtitle) {
    checks.push('❌ Subtitle missing');
    recommendations.push({
      type: 'quick-win',
      priority: 1,
      title: 'Add a subtitle',
      description: 'Use the 30 characters to highlight key benefits and secondary keywords.',
      evidence: 'Subtitle field is empty',
      afterExample: 'Discover millions of songs. Listen free.',
      impact: 'High - Adds keywords and benefits',
      effort: 'low',
    });
    return { score: 0, checks, recommendations };
  }

  const subtitleLength = app.subtitle.length;
  if (subtitleLength > 30) {
    checks.push('❌ Subtitle exceeds 30 characters');
    score += 0;
  } else if (subtitleLength > 20) {
    checks.push('✅ Good character utilization');
    score += 2;
  } else {
    checks.push('⚠️ Subtitle underutilized');
    score += 1;
  }

  const benefits = ['discover', 'listen', 'stream', 'free', 'download', 'learn', 'meditate'];
  const hasBenefit = benefits.some(b => app.subtitle.toLowerCase().includes(b));
  if (hasBenefit) {
    checks.push('✅ Benefit-driven subtitle');
    score += 3;
  } else {
    checks.push('⚠️ Subtitle lacks benefit framing');
    score += 1;
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreKeywordField(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  if (!app.keywordField) {
    checks.push('❌ Keyword field empty');
    recommendations.push({
      type: 'high-impact',
      priority: 1,
      title: 'Add keywords to keyword field',
      description: 'The keyword field is crucial for ASO. Use all 100 characters.',
      evidence: 'Keyword field is empty',
      afterExample: 'music,streaming,podcast,audio,playlists,songs,discover',
      impact: 'High - Critical for discoverability',
      effort: 'medium',
    });
    return { score: 0, checks, recommendations };
  }

  const keywords = app.keywordField.split(',');
  const keywordCount = keywords.length;
  if (keywordCount >= 10) {
    checks.push(`✅ ${keywordCount} keywords used`);
    score += 3;
  } else {
    checks.push(`⚠️ Only ${keywordCount} keywords used`);
    score += 1;
  }

  if (app.keywordField.length >= 90) {
    checks.push('✅ Good character utilization');
    score += 2;
  } else {
    checks.push(`⚠️ Only ${app.keywordField.length}/100 characters used`);
    score += 1;
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreDescription(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  if (!app.description) {
    checks.push('❌ Description missing');
    return { score: 0, checks, recommendations };
  }

  const descriptionLength = app.description.length;
  if (descriptionLength > 100) {
    checks.push(`✅ Description length: ${descriptionLength} characters`);
    score += 3;
  } else {
    checks.push('⚠️ Description too short');
    score += 1;
  }

  const words = app.description.split(' ');
  if (words.length > 50) {
    checks.push('✅ Detailed description');
    score += 2;
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreScreenshots(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  const screenshotCount = app.screenshots?.length || 0;
  if (screenshotCount >= 8) {
    checks.push(`✅ ${screenshotCount}/10 screenshots used`);
    score += 5;
  } else if (screenshotCount > 0) {
    checks.push(`⚠️ Only ${screenshotCount}/10 screenshots used`);
    score += 2;
    recommendations.push({
      type: 'quick-win',
      priority: 2,
      title: 'Add more screenshots',
      description: 'Apple allows up to 10 screenshots. Use all slots to showcase your app.',
      evidence: `Currently using ${screenshotCount} screenshots`,
      impact: 'Medium - Improves conversion',
      effort: 'low',
    });
  } else {
    checks.push('❌ No screenshots found');
    score += 0;
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreRatings(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  let score = 0;
  const recommendations: Recommendation[] = [];

  if (app.rating > 0) {
    const ratingScore = app.rating / 5 * 5;
    score += ratingScore;
    checks.push(`✅ Rating: ${app.rating.toFixed(1)}/5 from ${app.reviewCount} reviews`);
  } else {
    checks.push('⚠️ No ratings available');
  }

  return {
    score: Math.min(Math.round(score), 10),
    checks,
    recommendations,
  };
}

function scoreIcon(app: AppMetadata): { score: number; checks: string[]; recommendations: Recommendation[] } {
  const checks: string[] = [];
  const recommendations: Recommendation[] = [];

  if (app.icon) {
    checks.push('✅ Icon present');
    return { score: 8, checks, recommendations };
  }

  checks.push('❌ No icon found');
  recommendations.push({
    type: 'high-impact',
    priority: 3,
    title: 'Add app icon',
    description: 'A distinctive icon is crucial for brand recognition in search results.',
    evidence: 'No icon found in listing',
    impact: 'High - Brand identity',
    effort: 'medium',
  });
  return { score: 0, checks, recommendations };
}

export function performAudit(appMetadata: AppMetadata): AuditResult {
  const dimensions: AuditDimension[] = [];
  const allRecommendations: Recommendation[] = [];

  const titleAudit = scoreTitle(appMetadata);
  const subtitleAudit = scoreSubtitle(appMetadata);
  const keywordAudit = scoreKeywordField(appMetadata);
  const descriptionAudit = scoreDescription(appMetadata);
  const screenshotAudit = scoreScreenshots(appMetadata);
  const ratingAudit = scoreRatings(appMetadata);
  const iconAudit = scoreIcon(appMetadata);

  const auditData = [
    { name: 'Title', audit: titleAudit, weight: 20 },
    { name: 'Subtitle', audit: subtitleAudit, weight: 15 },
    { name: 'Keyword Field', audit: keywordAudit, weight: 15 },
    { name: 'Description', audit: descriptionAudit, weight: 10 },
    { name: 'Screenshots', audit: screenshotAudit, weight: 15 },
    { name: 'Ratings & Reviews', audit: ratingAudit, weight: 15 },
    { name: 'Icon', audit: iconAudit, weight: 10 },
  ];

  auditData.forEach(({ name, audit, weight }) => {
    dimensions.push({
      name,
      score: audit.score,
      maxScore: 10,
      weight,
      checks: audit.checks,
      details: `${name} optimization analysis`,
      recommendations: audit.recommendations,
    });
    allRecommendations.push(...audit.recommendations);
  });

  const weightedScore = dimensions.reduce((acc, d) => acc + (d.score / d.maxScore) * d.weight, 0);
  const overallScore = Math.round(weightedScore);

  return {
    appMetadata,
    overallScore,
    dimensions,
    quickWins: allRecommendations.filter(r => r.type === 'quick-win').slice(0, 5),
    highImpactChanges: allRecommendations.filter(r => r.type === 'high-impact').slice(0, 5),
    strategicRecommendations: allRecommendations.filter(r => r.type === 'strategic').slice(0, 5),
    competitorComparison: [],
    timestamp: new Date(),
  };
}
