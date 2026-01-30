
import { GoogleGenAI } from "@google/genai";
import { AnalysisResponse } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ConnectivityStatus {
  status: 'online' | 'offline' | 'degraded';
  message: string;
  latency?: number;
}

/**
 * Exponential backoff utility for handling rate limits (429 errors)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429;
      if (isRateLimit && i < maxRetries - 1) {
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
        continue;
      }
      throw error;
    }
  }
  return await fn();
}

/**
 * Diagnostic tool to verify API connectivity
 */
export const testConnectivity = async (): Promise<ConnectivityStatus> => {
  const start = Date.now();
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use a tiny, fast prompt to minimize token usage
    const response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: 'ping',
      config: { maxOutputTokens: 5 }
    });
    
    if (response.text) {
      return { 
        status: 'online', 
        message: 'System connectivity established.', 
        latency: Date.now() - start 
      };
    }
    return { status: 'degraded', message: 'API responded but payload was empty.' };
  } catch (error: any) {
    console.error("Connectivity Test Failed:", error);
    if (error?.message?.includes('429')) return { status: 'degraded', message: 'Rate limit (429) active on this project.' };
    if (error?.message?.includes('API_KEY')) return { status: 'offline', message: 'Invalid or missing API Key configuration.' };
    return { status: 'offline', message: 'Network timeout or unreachable host.' };
  }
};

export const getMarketIntelligence = async (symbol: string, query: string = ''): Promise<AnalysisResponse> => {
  const prompt = `Perform institutional-grade analysis for ${symbol}. 
  ${query ? `Specific research mandate: ${query}` : 'Provide a comprehensive market intelligence update.'}
  
  Focus heavily on:
  1. Current market regime classification.
  2. Microstructure analysis including simulated L2 order book depth (bid/ask/sizes) based on recent volatility.
  3. Narrative velocity: identifies trending keywords, sentiment shift, and entity extraction (CEOs, Companies).
  4. Real-time data synthesis from Google Search.`;
  
  return await retryWithBackoff(async () => {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType: 'application/json' is removed here to avoid conflict with tools
        temperature: 0.1,
      },
    });

    let text = response.text || '{}';
    
    // Sanitize text: Remove markdown code blocks if the model wrapped the JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      // First try standard parse
      data = JSON.parse(text);
    } catch (e) {
      // If parsing fails, try to find the first '{' and last '}' to extract the JSON block
      const startIdx = text.indexOf('{');
      const endIdx = text.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          data = JSON.parse(text.substring(startIdx, endIdx + 1));
        } catch (innerError) {
          throw new Error("MODEL_JSON_ERROR: Failed to parse intelligence output. Response was not valid JSON.");
        }
      } else {
        throw new Error("MODEL_JSON_ERROR: No JSON block found in model response.");
      }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Market Source',
        uri: chunk.web?.uri || '',
      }))
      .filter((s: any) => s.uri !== '');

    return {
      ...data,
      groundingSources: sources,
    };
  });
};
