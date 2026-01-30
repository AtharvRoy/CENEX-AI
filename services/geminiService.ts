
import { GoogleGenAI } from "@google/genai";
import { AnalysisResponse, MarketRegime } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

export interface ConnectivityStatus {
  status: 'online' | 'offline' | 'degraded';
  message: string;
  latency?: number;
}

/**
 * Normalizes the AI response to ensure all mandatory properties exist.
 */
function normalizeResponse(data: any, symbol: string): AnalysisResponse {
  const defaultProb = { bullish: 33, neutral: 34, bearish: 33 };
  
  return {
    assetName: data.assetName || symbol,
    symbol: data.symbol || symbol,
    timestamp: data.timestamp || new Date().toISOString(),
    marketRegime: data.marketRegime || MarketRegime.TRENDING,
    directionalAssessment: {
      shortTerm: data.directionalAssessment?.shortTerm || { bias: 'Neutral', probability: defaultProb },
      mediumTerm: data.directionalAssessment?.mediumTerm || { bias: 'Neutral', probability: defaultProb },
      longTerm: data.directionalAssessment?.longTerm || { bias: 'Neutral', probability: defaultProb },
    },
    technicalStructure: {
      trend: data.technicalStructure?.trend || 'Lateral',
      supportZones: data.technicalStructure?.supportZones || [],
      resistanceZones: data.technicalStructure?.resistanceZones || [],
      momentum: data.technicalStructure?.momentum || 'Neutral',
      volatilityRegime: data.technicalStructure?.volatilityRegime || 'Normal',
      breadthSignals: data.technicalStructure?.breadthSignals || 'Neutral',
    },
    macroContext: {
      interestRateEnv: data.macroContext?.interestRateEnv || 'Unchanged',
      inflationTrends: data.macroContext?.inflationTrends || 'Stable',
      liquidityConditions: data.macroContext?.liquidityConditions || 'Nominal',
      earningsOutlook: data.macroContext?.earningsOutlook || 'Neutral',
      sectorRotation: data.macroContext?.sectorRotation || 'None detected',
    },
    microstructure: data.microstructure || {
      bid: 100,
      ask: 100.01,
      spread: 0.01,
      liquidityScore: 50,
      orderFlowBias: 'Neutral',
      depthLevels: []
    },
    narrativeIntelligence: data.narrativeIntelligence || {
      entities: { companies: [], persons: [], products: [] },
      narrativeVelocity: 'Stable',
      sentimentIndex: 0,
      sentimentBreakdown: { positive: 0, neutral: 100, negative: 0 },
      keyThemes: [],
      narrativeArchetype: 'Informationally Efficient'
    },
    eventImpact: data.eventImpact || 'No major events identified.',
    riskFactors: data.riskFactors || [],
    strategicPositioning: data.strategicPositioning || {
      bias: 'Neutral',
      logic: 'Waiting for directional confirmation.',
      entryZones: 'N/A',
      stopZones: 'N/A',
      positionSizing: '0%'
    },
    confidenceScore: data.confidenceScore || 'Medium',
    confidenceRationale: data.confidenceRationale || [],
    uncertaintyExplanation: data.uncertaintyExplanation || 'Insufficient data for high-confidence modeling.',
    groundingSources: data.groundingSources || []
  };
}

/**
 * Robust error message extraction. 
 * Handles Error objects, strings, and raw API JSON response objects.
 */
function parseErrorMessage(error: any): string {
  if (!error) return "Unknown Logic Fault";

  // Case 1: Raw API Error Object { error: { message: "...", code: 429 } }
  if (error.error && typeof error.error.message === 'string') {
    return error.error.message;
  }

  // Case 2: Standard Error Object or String
  let msg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));

  // Case 3: Message itself is stringified JSON
  try {
    const trimmed = msg.trim();
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.error && parsed.error.message) return parsed.error.message;
      if (parsed.message) return parsed.message;
    }
  } catch (e) {
    // Not JSON, continue with original msg
  }

  return msg;
}

/**
 * Backoff utility. Zero retries for quota/auth errors.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
  initialDelay: number = 3000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = parseErrorMessage(error);
      const isQuota = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.toLowerCase().includes('quota');
      const isNotFound = errorMsg.includes('Requested entity was not found');
      
      // Critical auth/quota issues: fail immediately
      if (isQuota || isNotFound) {
        throw error;
      }
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
        continue;
      }
      throw error;
    }
  }
  return await fn(); // Should not reach here
}

export const testConnectivity = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'system.health.ping',
      config: { maxOutputTokens: 2 }
    });
    
    if (response.text) {
      return { status: 'online', message: 'Core Protocol Healthy.', latency: Date.now() - start };
    }
    return { status: 'degraded', message: 'Partial Data Integrity.' };
  } catch (error: any) {
    const msg = parseErrorMessage(error);
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota');
    if (isQuota) return { status: 'degraded', message: 'Quota Exhausted.' };
    return { status: 'offline', message: 'Protocol Disruption.' };
  }
};

export const getMarketIntelligence = async (symbol: string, query: string = ''): Promise<AnalysisResponse> => {
  const prompt = `Perform institutional-grade analysis for ${symbol}. 
  ${query ? `Specific research mandate: ${query}` : 'Provide a comprehensive market intelligence update.'}
  Focus on identifying Regime changes and Sentiment Velocity.`;
  
  return await retryWithBackoff(async () => {
    // FRESH INSTANCE MANDATORY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    let text = response.text || '{}';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        data = JSON.parse(text.substring(startIdx, endIdx + 1));
      } else {
        throw new Error("CORE_PROTOCOL_FAULT: Payload malformed.");
      }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || 'External Source',
        uri: chunk.web?.uri || '',
      }))
      .filter((s: any) => s.uri !== '');

    const normalized = normalizeResponse(data, symbol);
    return { ...normalized, groundingSources: sources };
  });
};
