import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-session conversation history (last 20 messages)
const conversationMemory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

async function getMarketSnapshot(): Promise<any[]> {
  try {
    const resp = await fetch('http://localhost:10000/api/market-data');
    if (resp.ok) {
      const data = await resp.json();
      // Return top 20 assets by volume/relevance
      return (data.assets || data || []).slice(0, 20).map((a: any) => ({
        symbol: a.symbol,
        name: a.name,
        price: a.price,
        change: a.change,
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

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.json({
        answer: "AI chat requires an ANTHROPIC_API_KEY environment variable. Add it to your Render environment variables to enable real AI responses.",
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
          `${p.symbol}: ${p.quantity} shares @ avg $${p.averagePrice}, current value $${p.currentValue ?? p.totalCost}, P&L: ${p.unrealizedPnL ? '$' + parseFloat(p.unrealizedPnL).toFixed(2) : 'unknown'}`
        ).join('\n')
      : 'No positions yet';

    const systemPrompt = `You are an expert financial advisor for MarketPulse, a paper trading platform (virtual money only — not real trading).

User's current portfolio:
${portfolioSummary}

Available cash: $${cashBalance.toFixed ? cashBalance.toFixed(2) : cashBalance}

Live market snapshot (top 20 assets):
${marketData.map(a => `${a.symbol} (${a.name}): $${a.price} (${a.changePercent > 0 ? '+' : ''}${a.changePercent?.toFixed(2)}%)`).join('\n')}

Guidelines:
- Give specific, actionable advice referencing actual prices and the user's real positions
- Always remind users this is paper trading (virtual money)
- Be concise — 2-4 sentences max unless asked for detail
- Format recommendations as: SYMBOL: ACTION — reason
- If asked about a stock not in the snapshot, say you don't have live data for it right now`;

    history.push({ role: 'user', content: query });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: history.slice(-20),
    });

    const answer = (response.content[0] as any).text;
    history.push({ role: 'assistant', content: answer });

    // Keep last 20 messages
    if (history.length > 20) history.splice(0, history.length - 20);

    res.json({
      answer,
      confidence: 0.95,
      timestamp: new Date().toISOString(),
      dataSource: 'Claude AI with live market context',
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
