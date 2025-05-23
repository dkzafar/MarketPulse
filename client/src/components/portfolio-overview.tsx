import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, Plus, DollarSign, Activity, PieChart } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PortfolioPosition {
  id: number;
  symbol: string;
  quantity: string;
  averagePrice: string;
  totalCost: string;
  currentValue: string | null;
  unrealizedPnL: string | null;
  createdAt: string;
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
  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    quantity: '',
    price: '',
    type: 'buy' as 'buy' | 'sell',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: positions = [], isLoading, error } = useQuery<PortfolioPosition[]>({
    queryKey: ['/api/portfolio'],
    queryFn: () => apiRequest('/api/portfolio'),
  });

  const addTransactionMutation = useMutation({
    mutationFn: (transaction: typeof newTransaction) =>
      apiRequest('/api/portfolio/transaction', {
        method: 'POST',
        body: JSON.stringify(transaction),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setShowAddTransaction(false);
      setNewTransaction({
        symbol: '',
        quantity: '',
        price: '',
        type: 'buy',
        notes: ''
      });
    },
  });

  const handleAddTransaction = () => {
    if (!newTransaction.symbol || !newTransaction.quantity || !newTransaction.price) {
      return;
    }
    addTransactionMutation.mutate(newTransaction);
  };

  const calculateTotalValue = () => {
    return positions.reduce((total, position) => {
      const value = position.currentValue ? parseFloat(position.currentValue) : parseFloat(position.totalCost);
      return total + value;
    }, 0);
  };

  const calculateTotalPnL = () => {
    return positions.reduce((total, position) => {
      if (position.unrealizedPnL) {
        return total + parseFloat(position.unrealizedPnL);
      }
      return total;
    }, 0);
  };

  const totalValue = calculateTotalValue();
  const totalPnL = calculateTotalPnL();
  const totalPnLPercent = positions.length > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {positions.length} position{positions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalPnL).toLocaleString()}
            </div>
            <p className={`text-xs ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnL >= 0 ? '+' : '-'}{Math.abs(totalPnLPercent).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Diversity</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
            <p className="text-xs text-muted-foreground">
              Unique holdings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Positions</h2>
        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol">Stock Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={newTransaction.symbol}
                    onChange={(e) => setNewTransaction({...newTransaction, symbol: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select value={newTransaction.type} onValueChange={(value: 'buy' | 'sell') => setNewTransaction({...newTransaction, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="100"
                    value={newTransaction.quantity}
                    onChange={(e) => setNewTransaction({...newTransaction, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Share</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="150.00"
                    step="0.01"
                    value={newTransaction.price}
                    onChange={(e) => setNewTransaction({...newTransaction, price: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this transaction"
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction} disabled={addTransactionMutation.isPending}>
                  {addTransactionMutation.isPending ? 'Adding...' : 'Add Transaction'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Positions Grid */}
      {positions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building your portfolio by adding your first transaction
            </p>
            <Button onClick={() => setShowAddTransaction(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position) => {
            const quantity = parseFloat(position.quantity);
            const avgPrice = parseFloat(position.averagePrice);
            const totalCost = parseFloat(position.totalCost);
            const currentValue = position.currentValue ? parseFloat(position.currentValue) : totalCost;
            const unrealizedPnL = position.unrealizedPnL ? parseFloat(position.unrealizedPnL) : 0;
            const pnlPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

            return (
              <Card key={position.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold">{position.symbol}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {quantity} shares @ ${avgPrice.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant={unrealizedPnL >= 0 ? "default" : "destructive"}>
                      {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Cost:</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Value:</span>
                      <span>${currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Return:</span>
                      <div className="flex items-center space-x-1">
                        {unrealizedPnL >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className={unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
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
    </div>
  );
}