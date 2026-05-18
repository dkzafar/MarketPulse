import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Plus, DollarSign, Activity, PieChart, Clock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

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

export default function PortfolioOverview() {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    quantity: '',
    price: '',
    type: 'buy' as 'buy' | 'sell',
    notes: '',
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cashBalance = (user as any)?.cashBalance ?? 0;

  const { data: positions = [], isLoading } = useQuery<PortfolioPosition[]>({
    queryKey: ['/api/portfolio/positions'],
    queryFn: async () => {
      const resp = await fetch('/api/portfolio/positions');
      if (!resp.ok) throw new Error('Failed to fetch positions');
      return resp.json();
    },
    refetchInterval: 60000,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/portfolio/transactions'],
    queryFn: async () => {
      const resp = await fetch('/api/portfolio/transactions');
      if (!resp.ok) return [];
      return resp.json();
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (tx: typeof newTransaction) => {
      const resp = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to add transaction');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/positions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setShowAddTransaction(false);
      setTxError(null);
      setNewTransaction({ symbol: '', quantity: '', price: '', type: 'buy', notes: '' });
    },
    onError: (error: any) => setTxError(error.message),
  });

  const totalCost = positions.reduce((sum, p) => sum + parseFloat(p.totalCost), 0);
  const totalValue = positions.reduce((sum, p) =>
    sum + (p.currentValue ? parseFloat(p.currentValue) : parseFloat(p.totalCost)), 0);
  const totalPnL = positions.reduce((sum, p) =>
    sum + (p.unrealizedPnL ? parseFloat(p.unrealizedPnL) : 0), 0);
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
  const estimatedCost = newTransaction.quantity && newTransaction.price
    ? parseFloat(newTransaction.quantity) * parseFloat(newTransaction.price) : 0;

  if (isLoading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse"><CardContent className="p-6 h-24" /></Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Holdings Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{positions.length} position{positions.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Buying power</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {totalPnL >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className={`text-xs ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% return
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Account</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalValue + cashBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Holdings + cash</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Positions</h2>
        <Dialog open={showAddTransaction} onOpenChange={(open) => { setShowAddTransaction(open); if (!open) setTxError(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Place Trade</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Place Trade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="text-sm bg-muted p-3 rounded">
                Buying power: <span className="font-semibold text-green-600">${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {txError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{txError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Symbol</Label>
                  <Input placeholder="AAPL" value={newTransaction.symbol}
                    onChange={(e) => setNewTransaction({ ...newTransaction, symbol: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newTransaction.type} onValueChange={(v: 'buy' | 'sell') => setNewTransaction({ ...newTransaction, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity (shares)</Label>
                  <Input type="number" min="0.001" step="0.001" placeholder="10" value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })} />
                </div>
                <div>
                  <Label>Price per share ($)</Label>
                  <Input type="number" min="0.01" step="0.01" placeholder="150.00" value={newTransaction.price}
                    onChange={(e) => setNewTransaction({ ...newTransaction, price: e.target.value })} />
                </div>
              </div>
              {estimatedCost > 0 && (
                <div className={`text-sm p-2 rounded ${newTransaction.type === 'buy' && estimatedCost > cashBalance ? 'bg-red-100 dark:bg-red-900/30 text-red-700' : 'bg-muted text-muted-foreground'}`}>
                  {newTransaction.type === 'buy' ? 'Total cost' : 'Proceeds'}: <strong>${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                  {newTransaction.type === 'buy' && estimatedCost > cashBalance && ' — insufficient funds'}
                </div>
              )}
              <div>
                <Label>Notes (optional)</Label>
                <Input placeholder="Reason for trade..." value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddTransaction(false)}>Cancel</Button>
                <Button
                  onClick={() => { setTxError(null); if (newTransaction.symbol && newTransaction.quantity && newTransaction.price) addTransactionMutation.mutate(newTransaction); }}
                  disabled={addTransactionMutation.isPending || !newTransaction.symbol || !newTransaction.quantity || !newTransaction.price || (newTransaction.type === 'buy' && estimatedCost > cashBalance)}
                  className={newTransaction.type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {addTransactionMutation.isPending ? 'Processing...' : `Confirm ${newTransaction.type === 'buy' ? 'Buy' : 'Sell'}`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {positions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You have ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ready to invest.
            </p>
            <Button onClick={() => setShowAddTransaction(true)}><Plus className="w-4 h-4 mr-2" />Place First Trade</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position) => {
            const qty = parseFloat(position.quantity);
            const avgPrice = parseFloat(position.averagePrice);
            const totalCostPos = parseFloat(position.totalCost);
            const currentValue = position.currentValue ? parseFloat(position.currentValue) : totalCostPos;
            const unrealizedPnL = position.unrealizedPnL ? parseFloat(position.unrealizedPnL) : 0;
            const pnlPercent = totalCostPos > 0 ? (unrealizedPnL / totalCostPos) * 100 : 0;
            const currentPrice = qty > 0 ? currentValue / qty : avgPrice;
            return (
              <Card key={position.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{position.symbol}</CardTitle>
                      <p className="text-sm text-muted-foreground">{qty} shares @ ${avgPrice.toFixed(2)} avg</p>
                    </div>
                    <Badge variant={unrealizedPnL >= 0 ? 'default' : 'destructive'}>
                      {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current price:</span>
                      <span className="font-medium">${currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Market value:</span>
                      <span>${currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cost basis:</span>
                      <span>${totalCostPos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-sm text-muted-foreground">Return:</span>
                      <div className="flex items-center gap-1">
                        {unrealizedPnL >= 0 ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />}
                        <span className={`font-medium ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {transactions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr className="text-muted-foreground">
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Symbol</th>
                      <th className="text-center p-4">Type</th>
                      <th className="text-right p-4">Shares</th>
                      <th className="text-right p-4">Price</th>
                      <th className="text-right p-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 30).map((tx) => (
                      <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(tx.executedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-4 font-semibold">{tx.symbol}</td>
                        <td className="p-4 text-center">
                          <Badge variant={tx.type === 'buy' ? 'default' : 'secondary'}>{tx.type.toUpperCase()}</Badge>
                        </td>
                        <td className="p-4 text-right">{parseFloat(tx.quantity)}</td>
                        <td className="p-4 text-right">${parseFloat(tx.price).toFixed(2)}</td>
                        <td className="p-4 text-right font-medium">
                          <span className={tx.type === 'buy' ? 'text-red-500' : 'text-green-500'}>
                            {tx.type === 'buy' ? '-' : '+'}${parseFloat(tx.totalAmount).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
