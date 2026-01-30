
export interface ProbabilityDistribution {
  bullish: number;
  neutral: number;
  bearish: number;
}

export interface BiasAssessment {
  shortTerm: { bias: string; probability: ProbabilityDistribution };
  mediumTerm: { bias: string; probability: ProbabilityDistribution };
  longTerm: { bias: string; probability: ProbabilityDistribution };
}

export interface TechnicalStructure {
  trend: string;
  supportZones: string[];
  resistanceZones: string[];
  momentum: string;
  volatilityRegime: string;
  breadthSignals: string;
}

export interface MacroContext {
  interestRateEnv: string;
  inflationTrends: string;
  liquidityConditions: string;
  earningsOutlook: string;
  sectorRotation: string;
}

export interface StrategicPositioning {
  bias: string;
  logic: string;
  entryZones: string;
  stopZones: string;
  positionSizing: string;
}

export interface MicrostructureData {
  bid: number;
  ask: number;
  spread: number;
  liquidityScore: number; // 0-100
  orderFlowBias: 'Bullish' | 'Bearish' | 'Neutral';
  depthLevels: Array<{ price: number; size: number; side: 'bid' | 'ask' }>;
}

export interface NarrativeIntelligence {
  topEntities: string[];
  narrativeVelocity: 'Accelerating' | 'Decelerating' | 'Stable';
  sentimentIndex: number; // -100 to 100
  keyThemes: string[];
}

export interface AnalysisResponse {
  assetName: string;
  symbol: string;
  timestamp: string;
  marketRegime: MarketRegime;
  directionalAssessment: BiasAssessment;
  technicalStructure: TechnicalStructure;
  macroContext: MacroContext;
  microstructure: MicrostructureData;
  narrativeIntelligence: NarrativeIntelligence;
  eventImpact: string;
  riskFactors: string[];
  strategicPositioning: StrategicPositioning;
  confidenceScore: 'Low' | 'Medium' | 'High';
  confidenceRationale: string[]; // New field for detailing derivation and uncertainty
  uncertaintyExplanation: string;
  groundingSources: Array<{ title: string; uri: string }>;
}

export enum MarketRegime {
  RISK_ON = 'Risk-on',
  RISK_OFF = 'Risk-off',
  MEAN_REVERTING = 'Mean reverting',
  TRENDING = 'Trending',
  HIGH_VOLATILITY = 'High volatility',
  COMPRESSION = 'Compression phase'
}
