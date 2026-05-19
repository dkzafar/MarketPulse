import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTradeDialogProps {
  symbol: string;
  onClose: () => void;
}

export default function QuickTradeDialog({ symbol, onClose }: QuickTradeDialogProps) {
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get live price from market data
  const { data: marketData = [] } = useQuery<any[]>({
    queryKey: ['/api/market-data'],
    staleTime: 30000,
  });

  const asset = (marketData as any[]).find((a: any) => a.symbol === symbol);
  const price = asset?.price ?? 0;
  const changePercent = asset?.changePercent ?? 0;
  const positive = changePercent >= 0;

  const qty = parseFloat(quantity) || 0;
  const totalCost = qty * price;
  const cashBalance = user?.cashBalance ?? 0;
  const canAfford = type === 'sell' || totalCost <= cashBalance;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          symbol,
          type,
          quantity: String(qty),
          price: String(price),
          notes: `Quick trade via Markets`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Trade failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({ title: `${type === 'buy' ? 'Bought' : 'Sold'} ${qty} shares of ${symbol}` });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = () => {
    setError('');
    if (!qty || qty <= 0) { setError('Enter a valid quantity'); return; }
    if (type === 'buy' && !canAfford) { setError(`Insufficient funds. You have $${cashBalance.toFixed(2)}`); return; }
    mutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold">
              {symbol.slice(0, 2)}
            </span>
            Trade {symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live price */}
          {price > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <div className="text-right">
                <div className="font-bold">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={cn('text-xs flex items-center justify-end gap-0.5', positive ? 'text-green-500' : 'text-red-500')}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Buy / Sell toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              className={cn('flex-1 py-2 text-sm font-semibold transition-colors', type === 'buy' ? 'bg-green-500 text-white' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40')}
              onClick={() => setType('buy')}
            >Buy</button>
            <button
              className={cn('flex-1 py-2 text-sm font-semibold transition-colors', type === 'sell' ? 'bg-red-500 text-white' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40')}
              onClick={() => setType('sell')}
            >Sell</button>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Shares</Label>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={quantity}
              onChange={e => { setQuantity(e.target.value); setError(''); }}
            />
          </div>

          {/* Cost preview */}
          {qty > 0 && price > 0 && (
            <div className="space-y-1 p-3 bg-muted/20 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated {type === 'buy' ? 'Cost' : 'Proceeds'}</span>
                <span className="font-semibold">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {type === 'buy' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash after</span>
                  <span className={cn('font-semibold', canAfford ? 'text-green-500' : 'text-red-500')}>
                    ${Math.max(0, cashBalance - totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            className={cn('w-full', type === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600')}
            onClick={handleSubmit}
            disabled={mutation.isPending || !qty || qty <= 0}
          >
            {mutation.isPending ? 'Processing…' : `${type === 'buy' ? 'Buy' : 'Sell'} ${qty || ''} ${symbol}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">Paper trading — no real money involved</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
