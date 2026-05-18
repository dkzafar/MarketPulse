import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { User, DollarSign, TrendingUp, Activity, LogOut } from "lucide-react";

interface Transaction {
  id: number;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: string;
  price: string;
  totalAmount: string;
  executedAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const cashBalance = (user as any)?.cashBalance ?? 0;

  const { data: positions = [] } = useQuery<any[]>({
    queryKey: ['/api/portfolio/positions'],
    queryFn: async () => {
      const resp = await fetch('/api/portfolio/positions');
      if (!resp.ok) return [];
      return resp.json();
    },
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/portfolio/transactions'],
    queryFn: async () => {
      const resp = await fetch('/api/portfolio/transactions');
      if (!resp.ok) return [];
      return resp.json();
    },
  });

  const totalValue = positions.reduce((sum: number, p: any) =>
    sum + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost)), 0);
  const totalPnL = positions.reduce((sum: number, p: any) =>
    sum + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0), 0);
  const totalCost = positions.reduce((sum: number, p: any) => sum + parseFloat(p.totalCost), 0);
  const totalReturn = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const accountValue = totalValue + cashBalance;

  return (
    <div className="min-h-screen bg-background p-4 pb-24 lg:pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="outline" size="sm" onClick={logout} className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>

        {/* User Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.username}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <Badge className="mt-1">Paper Trader</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Account Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${accountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-500" /> Cash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Total Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="w-4 h-4" /> Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings summary */}
        {positions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Holdings ({positions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {positions.map((p: any) => {
                const pnl = p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0;
                const cost = parseFloat(p.totalCost);
                const pct = cost > 0 ? (pnl / cost) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{p.symbol}</span>
                      <span className="text-sm text-muted-foreground ml-2">{parseFloat(p.quantity)} shares</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}{pct.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
