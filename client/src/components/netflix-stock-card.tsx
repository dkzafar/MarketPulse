import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Plus, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface StockCardAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  category?: string;
  pe?: number;
  signal?: string;
}

interface NetflixStockCardProps {
  asset: StockCardAsset;
  onBuy?: (symbol: string) => void;
  onAnalyze?: (symbol: string) => void;
  compact?: boolean;
}

const categoryGradients: Record<string, string> = {
  tech:       'from-blue-950 to-indigo-900',
  crypto:     'from-orange-950 to-amber-900',
  finance:    'from-emerald-950 to-teal-900',
  healthcare: 'from-pink-950 to-rose-900',
  energy:     'from-yellow-950 to-orange-900',
  forex:      'from-violet-950 to-purple-900',
  etf:        'from-slate-800 to-slate-900',
  stocks:     'from-slate-900 to-blue-950',
};

const signalStyle: Record<string, string> = {
  BUY:   'bg-green-500/20 text-green-300 border-green-500/30',
  SELL:  'bg-red-500/20 text-red-300 border-red-500/30',
  HOLD:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  WATCH: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
};

function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function NetflixStockCard({ asset, onBuy, onAnalyze, compact = false }: NetflixStockCardProps) {
  const positive = asset.changePercent >= 0;
  const grad = categoryGradients[asset.category?.toLowerCase() ?? ''] ?? categoryGradients.stocks;

  return (
    <motion.div
      whileHover={{ scale: 1.06, zIndex: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative flex-shrink-0 rounded-xl overflow-hidden border border-white/8 cursor-pointer group',
        'bg-gradient-to-br shadow-lg hover:shadow-2xl hover:border-white/20',
        grad,
        compact ? 'w-36' : 'w-44',
      )}
    >
      {/* Top accent bar */}
      <div className={cn(
        'absolute top-0 inset-x-0 h-px',
        positive
          ? 'bg-gradient-to-r from-transparent via-green-400/70 to-transparent'
          : 'bg-gradient-to-r from-transparent via-red-400/70 to-transparent',
      )} />

      <div className="p-4 flex flex-col gap-2">
        {/* Avatar + signal */}
        <div className="flex justify-between items-start">
          <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white select-none">
            {asset.symbol.slice(0, 2)}
          </div>
          {asset.signal && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none', signalStyle[asset.signal] ?? signalStyle.WATCH)}>
              {asset.signal}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="text-lg font-bold text-white leading-tight">
          ${asset.price < 1
            ? asset.price.toFixed(4)
            : asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* Change */}
        <div className={cn('flex items-center text-xs font-semibold', positive ? 'text-green-400' : 'text-red-400')}>
          {positive ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
          {positive ? '+' : ''}{asset.changePercent.toFixed(2)}%
        </div>

        {/* Symbol + Name */}
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{asset.symbol}</p>
          <p className="text-xs text-white/50 truncate">{asset.name}</p>
        </div>

        {/* Hover reveal */}
        {!compact && (
          <div className="overflow-hidden max-h-0 group-hover:max-h-20 transition-all duration-300 ease-out">
            <div className="pt-1 space-y-0.5">
              {asset.marketCap ? <p className="text-[10px] text-white/40">MCap: {fmtCap(asset.marketCap)}</p> : null}
              {asset.volume    ? <p className="text-[10px] text-white/40">Vol: {(asset.volume / 1e6).toFixed(1)}M</p> : null}
              <div className="flex gap-1 pt-1">
                <Button
                  size="sm"
                  className="flex-1 h-6 text-[10px] bg-green-500/80 hover:bg-green-500 text-white border-0 px-2"
                  onClick={e => { e.stopPropagation(); onBuy?.(asset.symbol); }}
                >
                  <Plus className="h-2.5 w-2.5 mr-1" />Buy
                </Button>
                {onAnalyze && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 border border-white/20 bg-white/5 hover:bg-white/15"
                    onClick={e => { e.stopPropagation(); onAnalyze(asset.symbol); }}
                  >
                    <Brain className="h-2.5 w-2.5 text-white/80" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
