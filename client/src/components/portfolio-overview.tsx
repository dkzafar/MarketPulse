import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Plus, DollarSign, Activity, Wallet, BarChart3, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import QuickTradeDialog from '@/components/quick-trade-dialog';

interface PortfolioPosition {
  id: number;
  symbol: string;
  quantity: string;
  averagePrice: string;
  totalCost: string;
  currentValue: string | null;
  unrealizedPnL: string | null;
}

interface Transaction {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: string;
  price: string;
  totalAmount: string;
  executedAt: string;
  notes: string | null;
}

const positionGradients = [
  'from-blue-950 to-indigo-900',
  'from-emerald-950 to-teal-900',
  'from-violet-950 to-purple-900',
  'from-orange-950 to-amber-900',
  'from-rose-950 to-pink-900',
  'from-cyan-950 to-sky-900',
  'from-yellow-950 to-lime-900',
  'from-slate-800 to-slate-900',
];

export default function PortfolioOverview() {
  const [showManualTrade, setShowManualTrade] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    symbol: '', quantity: '', price: '', type: 'buy' as 'buy' | 'sell', notes: '',
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cashBalance = (user as any)?.cashBalance ?? 0;

  const { data: positions = [], isLoading } = useQuery<PortfolioPosition[]>({
    queryKey: ['/api/portfolio/positions'],
    queryFn: async () => {
      const r = await fetch('/api/portfolio/positions', { credentials: 'include' });
      if (!r.ok) throw new Error('Failed to fetch');
      return r.json();
    },
    refetchInterval: 60000,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/portfolio/transactions'],
    queryFn: async () => {
      const r = await fetch('/api/portfolio/transactions', { credentials: 'include' });
      return r.ok ? r.json() : [];
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (tx: typeof newTransaction) => {
      const r = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tx),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Trade failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setShowManualTrade(false);
      setTxError(null);
      setNewTransaction({ symbol: '', quantity: '', price: '', type: 'buy', notes: '' });
    },
    onError: (e: any) => setTxError(e.message),
  });

  // Totals
  const totalCost   = positions.reduce((s, p) => s + parseFloat(p.totalCost), 0);
  const totalValue  = positions.reduce((s, p) => s + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost)), 0);
  const totalPnL    = positions.reduce((s, p) => s + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0), 0);
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const accountValue = totalValue + cashBalance;

  const estimatedCost = parseFloat(newTransaction.quantity) * parseFloat(newTransaction.price) || 0;

  const handleManualSubmit = () => {
    setTxError(null);
    const { symbol, quantity, price } = newTransaction;
    if (!symbol || !quantity || !price) { setTxError('All fields are required'); return; }
    addTransactionMutation.mutate(newTransaction);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(135deg, #020817 0%, #0f172a 50%, #0c1a2e 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_40%,rgba(99,102,241,0.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(16,185,129,0.1),transparent_50%)]" />

        <div className="relative px-6 py-8 lg:px-10 lg:py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">My Portfolio</h1>
              <p className="text-white/40 text-sm mt-1">{positions.length} position{positions.length !== 1 ? 's' : ''} · {transactions.length} trades</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => setShowManualTrade(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Place Trade
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Account Value", value: `$${accountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign className="h-4 w-4" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { label: "Holdings", value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <BarChart3 className="h-4 w-4" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
              { label: "Unrealized P&L", value: `${totalPnL >= 0 ? '+' : ''}$${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`, icon: totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />, color: totalPnL >= 0 ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20" },
              { label: "Cash", value: `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <Wallet className="h-4 w-4" />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-xl border p-4 backdrop-blur-sm", s.color)}>
                <div className="flex items-center gap-2 text-xs mb-2 opacity-70">{s.icon}<span>{s.label}</span></div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                {s.sub && <div className="text-xs mt-1 opacity-60">{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* TABS */}
      <div className="px-6 py-6 lg:px-10">
        <Tabs defaultValue="holdings">
          <TabsList className="mb-6">
            <TabsTrigger value="holdings">Holdings ({positions.length})</TabsTrigger>
            <TabsTrigger value="history">History ({transactions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="holdings">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                ))}
              </div>
            ) : positions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <Activity className="h-14 w-14 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No positions yet</h3>
                <p className="text-muted-foreground mb-6">You have <span className="text-green-500 font-semibold">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> ready to invest.</p>
                <Button className="bg-green-500 hover:bg-green-600" onClick={() => setShowManualTrade(true)}>
                  <Plus className="h-4 w-4 mr-2" />Place First Trade
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map((position, idx) => {
                  const qty          = parseFloat(position.quantity);
                  const avgPrice     = parseFloat(position.averagePrice);
                  const totalCostPos = parseFloat(position.totalCost);
                  const currentValue = position.currentValue ? parseFloat(position.currentValue) : totalCostPos;
                  const pnl          = position.unrealizedPnL ? parseFloat(position.unrealizedPnL) : 0;
                  const pnlPct       = totalCostPos > 0 ? (pnl / totalCostPos) * 100 : 0;
                  const currentPrice = qty > 0 ? currentValue / qty : avgPrice;
                  const grad         = positionGradients[idx % positionGradients.length];

                  return (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        'relative rounded-xl overflow-hidden border border-white/8 bg-gradient-to-br shadow-lg hover:shadow-xl transition-shadow',
                        grad,
                      )}
                    >
                      {/* Top accent */}
                      <div className={cn(
                        'absolute top-0 inset-x-0 h-px',
                        pnl >= 0
                          ? 'bg-gradient-to-r from-transparent via-green-400/60 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-red-400/60 to-transparent',
                      )} />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                              {position.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-white">{position.symbol}</div>
                              <div className="text-xs text-white/50">{qty} shares</div>
                            </div>
                          </div>
                          <div className={cn("text-right", pnl >= 0 ? "text-green-400" : "text-red-400")}>
                            <div className="font-bold text-sm">{pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(2)}</div>
                            <div className="text-xs">{pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%</div>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-[10px] text-white/40 mb-1">Current</div>
                            <div className="text-sm font-semibold text-white">${currentPrice.toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-white/40 mb-1">Avg Buy</div>
                            <div className="text-sm font-semibold text-white">${avgPrice.toFixed(2)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-white/40 mb-1">Value</div>
                            <div className="text-sm font-semibold text-white">${currentValue.toFixed(2)}</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                          <div
                            className={cn("h-full rounded-full transition-all", pnl >= 0 ? "bg-green-400" : "bg-red-400")}
                            style={{ width: `${Math.min(100, Math.abs(pnlPct) * 5 + 20)}%` }}
                          />
                        </div>

                        {/* Quick trade */}
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs bg-white/10 hover:bg-white/20 text-white border border-white/10"
                          onClick={() => setTradeSymbol(position.symbol)}
                        >
                          Trade {position.symbol}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-30" />
                <p>No trades yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 50).map((tx, idx) => {
                  const total = parseFloat(tx.totalAmount);
                  const isBuy = tx.type === 'buy';
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold",
                          isBuy ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20",
                        )}>
                          {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-semibold">{tx.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            {parseFloat(tx.quantity)} shares @ ${parseFloat(tx.price).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div className={cn("font-semibold text-sm", isBuy ? "text-red-400" : "text-green-400")}>
                          {isBuy ? '-' : '+'}${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Manual trade dialog (for custom price/quantity input) */}
      <Dialog open={showManualTrade} onOpenChange={o => { setShowManualTrade(o); if (!o) setTxError(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Place Trade</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm bg-muted/30 p-3 rounded-lg">
              Cash available: <span className="font-semibold text-green-500">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {txError && (
              <div className="flex items-start gap-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5" /><span>{txError}</span>
              </div>
            )}
            <div className="flex rounded-lg overflow-hidden border border-border">
              {(['buy', 'sell'] as const).map(t => (
                <button
                  key={t}
                  className={cn('flex-1 py-2 text-sm font-semibold transition-colors capitalize', newTransaction.type === t ? (t === 'buy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-muted/20 text-muted-foreground')}
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: t }))}
                >{t}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Symbol</Label>
                <Input placeholder="AAPL" value={newTransaction.symbol} onChange={e => setNewTransaction(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <Label className="text-xs">Shares</Label>
                <Input type="number" min="0" placeholder="10" value={newTransaction.quantity} onChange={e => setNewTransaction(p => ({ ...p, quantity: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Price per share ($)</Label>
              <Input type="number" min="0" placeholder="150.00" value={newTransaction.price} onChange={e => setNewTransaction(p => ({ ...p, price: e.target.value }))} />
            </div>
            {estimatedCost > 0 && (
              <div className={cn("text-sm p-3 rounded-lg", newTransaction.type === 'buy' && estimatedCost > cashBalance ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-muted/20 text-muted-foreground")}>
                {newTransaction.type === 'buy' ? 'Total cost' : 'Proceeds'}: <strong>${estimatedCost.toFixed(2)}</strong>
                {newTransaction.type === 'buy' && estimatedCost > cashBalance && " — insufficient funds"}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowManualTrade(false)}>Cancel</Button>
              <Button
                className={cn("flex-1", newTransaction.type === 'buy' ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600")}
                onClick={handleManualSubmit}
                disabled={addTransactionMutation.isPending || !newTransaction.symbol || !newTransaction.quantity || !newTransaction.price || (newTransaction.type === 'buy' && estimatedCost > cashBalance)}
              >
                {addTransactionMutation.isPending ? "Processing…" : `Confirm ${newTransaction.type === 'buy' ? 'Buy' : 'Sell'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {tradeSymbol && (
        <QuickTradeDialog symbol={tradeSymbol} onClose={() => setTradeSymbol(null)} />
      )}
    </div>
  );
}
