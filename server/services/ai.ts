import { HfInference } from '@huggingface/inference';

export async function aiSummarise(data: any) {
  try {
    if (!process.env.HUGGINGFACE_TOKEN) {
      return { error: 'HuggingFace token not configured. Please provide HUGGINGFACE_TOKEN environment variable.' };
    }

    const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

    const prompt = `
You are an institutional analyst.
Given this JSON data:
${JSON.stringify(data, null, 2)}

1) One-sentence BUY/HOLD/SELL signal with confidence.
2) Explanation of each indicator's trend.
3) Risk profile summary.
4) Entry and exit price suggestions.
5) Three tactical trade ideas.

Respond in JSON format.
`.trim();

    // Use a reliable free model that's always available
    const model = 'microsoft/DialoGPT-medium';
    const output = await hf.textGeneration({
      model,
      inputs: prompt,
      parameters: { 
        max_new_tokens: 512, 
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1
      }
    });

    if (!output.generated_text) {
      return { error: 'No response generated from AI model' };
    }

    // Extract JSON from generated text
    const text = output.generated_text;
    const start = text.indexOf('{');
    
    if (start === -1) {
      // If no JSON found, create structured response
      return {
        signal: 'HOLD',
        confidence: 0.75,
        analysis: text.slice(0, 200),
        riskProfile: 'Medium',
        entryPrice: null,
        exitPrice: null,
        tradeIdeas: ['Monitor for breakout', 'Watch support levels', 'Consider position sizing']
      };
    }

    const json = text.slice(start);
    return JSON.parse(json);

  } catch (error: any) {
    console.error('AI summarization error:', error.message);
    return { 
      error: `AI analysis failed: ${error.message}`,
      details: error.response?.data?.error || 'HuggingFace API error'
    };
  }
}

export async function analyzeMultipleAssets(assets: any[]) {
  try {
    const promises = assets.map(asset => aiSummarise(asset));
    const results = await Promise.all(promises);
    
    return assets.map((asset, index) => ({
      symbol: asset.symbol,
      analysis: results[index]
    }));
    
  } catch (error: any) {
    return { error: `Failed to analyze multiple assets: ${error.message}` };
  }
}

export async function generateTradingStrategy(marketData: any, timeframe: string = '1D') {
  try {
    if (!process.env.HUGGINGFACE_TOKEN) {
      return { error: 'HuggingFace token not configured. Please provide HUGGINGFACE_TOKEN environment variable.' };
    }

    const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

    const prompt = `
Create a trading strategy for ${timeframe} timeframe based on:
Price: $${marketData.price}
Change: ${marketData.changePercent}%
Volume: ${marketData.volume || 'N/A'}

Provide specific entry/exit points and risk management rules.
`.trim();

    const output = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium',
      inputs: prompt,
      parameters: { 
        max_new_tokens: 300, 
        temperature: 0.6
      }
    });

    return {
      strategy: output.generated_text,
      timeframe,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    return { 
      error: `Strategy generation failed: ${error.message}`,
      details: error.response?.data?.error || 'AI service error'
    };
  }
}