// src/types/aso-types.ts

export interface AppMetadata {
  id: string;
  name: string;
  developer: string;
  icon: string;
  category: string;
  country: string;
  title: string;
  subtitle: string;
  description: string;
  keywordField: string;
  screenshots: string[];
  previewVideo: string | null;
  rating: number;
  reviewCount: number;
  ratingHistory: Array<{ date: string; rating: number }>;
  promotionalText: string | null;
  whatsNew: string | null;
  inAppEvents: string[];
  customProductPages: string[];
  url: string;
}

export interface AuditDimension {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  checks: string[];
  details: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'quick-win' | 'high-impact' | 'strategic';
  priority: number;
  title: string;
  description: string;
  evidence: string;
  beforeExample?: string;
  afterExample?: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface AuditResult {
  appMetadata: AppMetadata;
  overallScore: number;
  dimensions: AuditDimension[];
  quickWins: Recommendation[];
  highImpactChanges: Recommendation[];
  strategicRecommendations: Recommendation[];
  competitorComparison: CompetitorComparison[];
  timestamp: Date;
}

export interface CompetitorComparison {
  name: string;
  rating: number;
  reviewCount: number;
  keywordCoverage: number;
  visualStyle: string;
  ratingGap: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  auditResult?: AuditResult;
}
