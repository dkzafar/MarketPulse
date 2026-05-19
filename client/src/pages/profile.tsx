import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, DollarSign, TrendingUp, TrendingDown, Activity, LogOut, Wallet, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const cashBalance = (user as any)?.cashBalance ?? 0;

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio/positions"],
    queryFn: async () => {
      const r = await fetch("/api/portfolio/positions", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/portfolio/transactions"],
    queryFn: async () => {
      const r = await fetch("/api/portfolio/transactions", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
  });

  const totalValue  = positions.reduce((s: number, p: any) => s + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost)), 0);
  const totalPnL    = positions.reduce((s: number, p: any) => s + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0), 0);
  const totalCost   = positions.reduce((s: number, p: any) => s + parseFloat(p.totalCost), 0);
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const accountValue = totalValue + cashBalance;

  const initials = (user?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden border-b border-border"
        style={{ background: "linear-gradient(135deg, #020817 0%, #0f172a 60%, #1a0f2e 100%)" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.2),transparent_60%)]" />

        <div className="relative px-6 py-10 lg:px-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                <p className="text-white/40 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Paper Trader</Badge>
                  <span className="text-xs text-white/30">{transactions.length} trades</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/50 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Account Value", value: `$${accountValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign className="h-4 w-4" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { label: "Cash", value: `$${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <Wallet className="h-4 w-4" />, color: "text-green-400 bg-green-500/10 border-green-500/20" },
              { label: "Total Return", value: `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`, icon: totalReturn >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />, color: totalReturn >= 0 ? "text-green-400 bg-green-500/10 border-green-500/20" : "text-red-400 bg-red-500/10 border-red-500/20" },
              { label: "Positions", value: String(positions.length), icon: <BarChart3 className="h-4 w-4" />, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            ].map(s => (
              <div key={s.label} className={cn("rounded-xl border p-4 backdrop-blur-sm", s.color)}>
                <div className="flex items-center gap-2 text-xs mb-2 opacity-70">{s.icon}<span>{s.label}</span></div>
                <div className="text-xl font-bold text-white">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* HOLDINGS */}
      <div className="px-6 py-8 lg:px-10 space-y-6">
        {positions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Holdings</h2>
            <div className="space-y-2">
              {positions.map((p: any, idx: number) => {
                const pnl  = p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0;
                const cost = parseFloat(p.totalCost);
                const pct  = cost > 0 ? (pnl / cost) * 100 : 0;
                const val  = p.currentValue ? parseFloat(p.currentValue) : cost;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold">
                        {p.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{p.symbol}</div>
                        <div className="text-xs text-muted-foreground">{parseFloat(p.quantity)} shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className={cn("text-xs font-medium", pnl >= 0 ? "text-green-500" : "text-red-500")}>
                        {pnl >= 0 ? "+" : ""}{pct.toFixed(2)}% ({pnl >= 0 ? "+" : ""}${pnl.toFixed(2)})
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {positions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
            <p className="text-muted-foreground mb-4">Start trading to build your portfolio.</p>
            <Link href="/markets">
              <Button>Browse Markets</Button>
            </Link>
          </div>
        )}

        {/* Paper trading disclaimer */}
        <div className="p-4 rounded-xl bg-muted/20 border border-border text-center">
          <p className="text-sm text-muted-foreground">
            This is a <span className="font-semibold text-foreground">paper trading</span> account — no real money is involved. Starting balance: $10,000.
          </p>
        </div>
      </div>
    </div>
  );
}
