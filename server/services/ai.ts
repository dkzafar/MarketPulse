import { HfInference } from '@huggingface/inference';
import { AISummary, Signal } from '../types';

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN!);

export async function aiSummarise(data: any): Promise<AISummary> {
  const prompt = `
You are an institutional financial analyst. Analyze this market data and provide a professional trading recommendation in JSON format.

Market Data:
${JSON.stringify(data, null, 2)}

Provide your analysis in this exact JSON structure:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": number (0-1),
  "reasoning": "detailed explanation",
  "riskProfile": "low" | "medium" | "high",
  "entryPrice": number,
  "exitPrice": number,
  "tradeIdeas": ["idea1", "idea2", "idea3"],
  "signals": [{"action": "BUY|SELL|HOLD", "price": number, "date": "ISO date", "confidence": number}]
}

Base your analysis on:
1. Technical indicators (SMA50 vs SMA200, RSI levels, Bollinger Bands)
2. News sentiment scores
3. Price momentum and volume
4. Risk assessment based on volatility

Be precise and professional. No explanatory text outside the JSON.
`.trim();

  try {
    const output = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium',
      inputs: prompt,
      parameters: { 
        max_new_tokens: 512, 
        temperature: 0.3,
        return_full_text: false
      }
    });

    const text = output.generated_text.trim();
    
    // Extract JSON from response
    let jsonStart = text.indexOf('{');
    if (jsonStart === -1) {
      return generateFallbackAnalysis(data);
    }
    
    const jsonText = text.substring(jsonStart);
    
    try {
      const analysis = JSON.parse(jsonText);
      
      // Validate and sanitize the response
      return {
        signal: analysis.signal || determineFallbackSignal(data),
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        reasoning: analysis.reasoning || generateFallbackReasoning(data),
        riskProfile: analysis.riskProfile || 'medium',
        entryPrice: analysis.entryPrice || data.price,
        exitPrice: analysis.exitPrice || data.price * 1.1,
        tradeIdeas: analysis.tradeIdeas || generateFallbackTradeIdeas(data),
        signals: analysis.signals || generateFallbackSignals(data)
      };
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback analysis');
      return generateFallbackAnalysis(data);
    }
  } catch (error) {
    console.error('Hugging Face API error:', error);
    return generateFallbackAnalysis(data);
  }
}

function generateFallbackAnalysis(data: any): AISummary {
  const signal = determineFallbackSignal(data);
  const confidence = calculateFallbackConfidence(data);
  
  return {
    signal,
    confidence,
    reasoning: generateFallbackReasoning(data),
    riskProfile: determineRiskProfile(data),
    entryPrice: data.price,
    exitPrice: signal === 'BUY' ? data.price * 1.1 : data.price * 0.9,
    tradeIdeas: generateFallbackTradeIdeas(data),
    signals: generateFallbackSignals(data)
  };
}

function determineFallbackSignal(data: any): 'BUY' | 'SELL' | 'HOLD' {
  const indicators = data.extraIndicators;
  if (!indicators) return 'HOLD';
  
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // SMA analysis
  if (indicators.sma50 > indicators.sma200) bullishSignals++;
  else bearishSignals++;
  
  // RSI analysis
  if (indicators.rsi < 30) bullishSignals += 2; // Oversold
  else if (indicators.rsi > 70) bearishSignals += 2; // Overbought
  
  // News sentiment
  const avgSentiment = data.news?.reduce((sum: number, article: any) => sum + article.sentiment, 0) / (data.news?.length || 1);
  if (avgSentiment > 1) bullishSignals++;
  else if (avgSentiment < -1) bearishSignals++;
  
  // Price momentum
  if (data.changePercent > 2) bullishSignals++;
  else if (data.changePercent < -2) bearishSignals++;
  
  if (bullishSignals > bearishSignals + 1) return 'BUY';
  if (bearishSignals > bullishSignals + 1) return 'SELL';
  return 'HOLD';
}

function calculateFallbackConfidence(data: any): number {
  const indicators = data.extraIndicators;
  if (!indicators) return 0.5;
  
  let confidence = 0.5;
  
  // Strong technical signals increase confidence
  const smaSpread = Math.abs(indicators.sma50 - indicators.sma200) / indicators.sma200;
  confidence += Math.min(0.2, smaSpread * 2);
  
  // Extreme RSI values increase confidence
  if (indicators.rsi < 25 || indicators.rsi > 75) confidence += 0.1;
  
  // Strong news sentiment increases confidence
  const avgSentiment = Math.abs(data.news?.reduce((sum: number, article: any) => sum + article.sentiment, 0) / (data.news?.length || 1));
  confidence += Math.min(0.2, avgSentiment / 5);
  
  return Math.max(0.1, Math.min(0.95, confidence));
}

function generateFallbackReasoning(data: any): string {
  const signal = determineFallbackSignal(data);
  const indicators = data.extraIndicators;
  
  let reasoning = `${signal} recommendation based on technical analysis. `;
  
  if (indicators) {
    if (indicators.sma50 > indicators.sma200) {
      reasoning += 'Price above long-term trend. ';
    }
    
    if (indicators.rsi < 30) {
      reasoning += 'RSI indicates oversold conditions. ';
    } else if (indicators.rsi > 70) {
      reasoning += 'RSI indicates overbought conditions. ';
    }
  }
  
  if (data.changePercent > 0) {
    reasoning += `Positive momentum with ${data.changePercent.toFixed(2)}% change.`;
  }
  
  return reasoning;
}

function determineRiskProfile(data: any): 'low' | 'medium' | 'high' {
  const changePercent = Math.abs(data.changePercent || 0);
  
  if (changePercent > 5) return 'high';
  if (changePercent > 2) return 'medium';
  return 'low';
}

function generateFallbackTradeIdeas(data: any): string[] {
  const signal = determineFallbackSignal(data);
  
  if (signal === 'BUY') {
    return [
      'Long position with stop-loss at recent support level',
      'Dollar-cost averaging for long-term position',
      'Options strategy: sell puts to enter at lower price'
    ];
  } else if (signal === 'SELL') {
    return [
      'Short position with tight stop-loss',
      'Reduce position size gradually',
      'Hedge with protective puts'
    ];
  }
  
  return [
    'Monitor for breakout confirmation',
    'Wait for clearer technical signals',
    'Consider covered call strategy if holding'
  ];
}

function generateFallbackSignals(data: any): Signal[] {
  const currentDate = new Date().toISOString();
  const signal = determineFallbackSignal(data);
  const confidence = calculateFallbackConfidence(data);
  
  return [{
    action: signal,
    price: data.price,
    date: currentDate,
    confidence
  }];
}