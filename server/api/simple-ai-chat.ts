import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Groq uses the OpenAI-compatible API
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// Per-session conversation history (last 20 messages)
const conversationMemory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

async function getMarketSnapshot(): Promise<any[]> {
  try {
    const resp = await fetch('http://localhost:10000/api/market-data');
    if (resp.ok) {
      const data = await resp.json();
      return (data.assets || data || []).slice(0, 20).map((a: any) => ({
        symbol: a.symbol,
        name: a.name,
        price: a.price,
        changePercent: a.changePercent,
        category: a.category,
      }));
    }
  } catch {}
  return [];
}

router.post('/simple-ai-chat', async (req, res) => {
  try {
    const { query, sessionId = 'default', portfolio = [], cashBalance = 0 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        answer: "AI chat requires a GROQ_API_KEY environment variable. Get a free key at console.groq.com and add it to your Render environment variables.",
        confidence: 0,
        timestamp: new Date().toISOString(),
      });
    }

    if (!conversationMemory.has(sessionId)) {
      conversationMemory.set(sessionId, []);
    }
    const history = conversationMemory.get(sessionId)!;

    const marketData = await getMarketSnapshot();

    const portfolioSummary = portfolio.length > 0
      ? portfolio.map((p: any) =>
          `${p.symbol}: ${p.quantity} shares @ avg $${p.averagePrice}, value $${p.currentValue ?? p.totalCost}, P&L: ${p.unrealizedPnL ? '$' + parseFloat(p.unrealizedPnL).toFixed(2) : 'unknown'}`
        ).join('\n')
      : 'No positions yet';

    const systemPrompt = `You are a financial advisor for MarketPulse, a paper trading platform (virtual money — not real trading).

User's portfolio:
${portfolioSummary}

Cash available: $${typeof cashBalance === 'number' ? cashBalance.toFixed(2) : cashBalance}

Live market (top assets):
${marketData.map((a: any) => `${a.symbol} (${a.name}): $${a.price} (${a.changePercent > 0 ? '+' : ''}${a.changePercent?.toFixed(2)}%)`).join('\n')}

Be concise (2-4 sentences). Reference real prices and the user's actual positions. Always note this is paper trading.`;

    history.push({ role: 'user', content: query });

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-20),
      ],
    });

    const answer = response.choices[0]?.message?.content ?? 'No response generated.';
    history.push({ role: 'assistant', content: answer });

    if (history.length > 20) history.splice(0, history.length - 20);

    res.json({
      answer,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
      dataSource: 'Groq AI (Llama 3.1) with live market context',
      conversationTurn: history.length,
      hasMemory: history.length > 2,
    });

  } catch (error: any) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ error: 'AI chat failed', details: error.message });
  }
});

router.delete('/simple-ai-chat/:sessionId?', (req, res) => {
  const sessionId = req.params.sessionId || 'default';
  conversationMemory.delete(sessionId);
  res.json({ message: 'Conversation cleared', sessionId });
});

export default router;
