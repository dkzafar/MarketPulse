import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TechnicalIndicator {
  name: string;
  data: { time: string; value: number }[];
  color: string;
}

interface PatternAlert {
  pattern: string;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

interface TradingChartProps {
  symbol: string;
  data: ChartData[];
  className?: string;
}

export default function TradingChart({ symbol, data, className }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const candlestickSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeries = useRef<ISeriesApi<'Histogram'> | null>(null);
  
  const [timeframe, setTimeframe] = useState('1D');
  const [indicators, setIndicators] = useState<string[]>(['SMA20', 'SMA50']);
  const [patterns, setPatterns] = useState<PatternAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
    };

    chart.current = createChart(chartContainerRef.current, chartOptions);
    
    // Add candlestick series
    candlestickSeries.current = chart.current.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Add volume series
    volumeSeries.current = chart.current.addHistogramSeries({
      color: '#6b7280',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    // Position volume series at bottom
    chart.current.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Handle resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!candlestickSeries.current || !volumeSeries.current) return;

    const candlestickData = data.map(item => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData = data.map(item => ({
      time: item.time,
      value: item.volume || 0,
      color: item.close >= item.open ? '#10b981' : '#ef4444',
    }));

    candlestickSeries.current.setData(candlestickData);
    volumeSeries.current.setData(volumeData);

    // Auto-fit content
    if (chart.current) {
      chart.current.timeScale().fitContent();
    }

    // Detect patterns
    detectChartPatterns(data);
  }, [data]);

  // Add technical indicators
  useEffect(() => {
    if (!chart.current) return;

    // Clear existing indicator series (simplified for demo)
    indicators.forEach(indicator => {
      addTechnicalIndicator(indicator);
    });
  }, [indicators, data]);

  const addTechnicalIndicator = (indicator: string) => {
    if (!chart.current || !data.length) return;

    const closes = data.map(d => d.close);
    
    switch (indicator) {
      case 'SMA20':
        const sma20Data = calculateSMA(closes, 20).map((value, index) => ({
          time: data[index]?.time,
          value: value
        })).filter(item => item.time && !isNaN(item.value));

        const sma20Series = chart.current.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
          title: 'SMA 20',
        });
        sma20Series.setData(sma20Data);
        break;

      case 'SMA50':
        const sma50Data = calculateSMA(closes, 50).map((value, index) => ({
          time: data[index]?.time,
          value: value
        })).filter(item => item.time && !isNaN(item.value));

        const sma50Series = chart.current.addLineSeries({
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA 50',
        });
        sma50Series.setData(sma50Data);
        break;

      case 'EMA12':
        const ema12Data = calculateEMA(closes, 12).map((value, index) => ({
          time: data[index]?.time,
          value: value
        })).filter(item => item.time && !isNaN(item.value));

        const ema12Series = chart.current.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 2,
          title: 'EMA 12',
        });
        ema12Series.setData(ema12Data);
        break;
    }
  };

  const calculateSMA = (prices: number[], period: number): number[] => {
    const sma: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    
    return sma;
  };

  const calculateEMA = (prices: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  };

  const detectChartPatterns = async (chartData: ChartData[]) => {
    setIsLoading(true);
    
    // Simulate pattern detection (in real implementation, this would call your pattern recognition service)
    const detectedPatterns: PatternAlert[] = [];
    
    // Simple pattern detection examples
    const closes = chartData.map(d => d.close);
    const recent = closes.slice(-20);
    
    // Detect trend
    const firstPrice = recent[0];
    const lastPrice = recent[recent.length - 1];
    const trendChange = (lastPrice - firstPrice) / firstPrice;
    
    if (Math.abs(trendChange) > 0.05) {
      detectedPatterns.push({
        pattern: trendChange > 0 ? 'Uptrend' : 'Downtrend',
        confidence: Math.min(0.9, Math.abs(trendChange) * 10),
        direction: trendChange > 0 ? 'bullish' : 'bearish',
        description: `Strong ${trendChange > 0 ? 'upward' : 'downward'} momentum detected`
      });
    }
    
    // Detect volatility
    const volatility = calculateVolatility(recent);
    if (volatility > 0.3) {
      detectedPatterns.push({
        pattern: 'High Volatility',
        confidence: 0.8,
        direction: 'neutral',
        description: 'Increased price volatility indicates potential breakout'
      });
    }
    
    // Support/Resistance levels
    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const currentPrice = closes[closes.length - 1];
    
    const resistance = Math.max(...highs.slice(-50));
    const support = Math.min(...lows.slice(-50));
    
    if (currentPrice > resistance * 0.98) {
      detectedPatterns.push({
        pattern: 'Resistance Test',
        confidence: 0.75,
        direction: 'neutral',
        description: 'Price approaching key resistance level'
      });
    }
    
    if (currentPrice < support * 1.02) {
      detectedPatterns.push({
        pattern: 'Support Test',
        confidence: 0.75,
        direction: 'neutral',
        description: 'Price approaching key support level'
      });
    }
    
    setPatterns(detectedPatterns);
    setIsLoading(false);
  };

  const calculateVolatility = (prices: number[]): number => {
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  };

  const timeframeOptions = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1D', label: '1 Day' },
    { value: '1W', label: '1 Week' },
  ];

  const indicatorOptions = [
    'SMA20', 'SMA50', 'SMA200', 'EMA12', 'EMA26', 'RSI', 'MACD', 'Bollinger Bands'
  ];

  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white">
            {symbol} Chart Analysis
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Chart Container */}
        <div className="relative">
          <div
            ref={chartContainerRef}
            className="w-full h-96 bg-gray-900"
          />
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <div className="text-white">Analyzing patterns...</div>
            </div>
          )}
        </div>

        {/* Technical Indicators Panel */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium text-gray-300">Technical Indicators:</span>
            <div className="flex flex-wrap gap-2">
              {indicatorOptions.map(indicator => (
                <Button
                  key={indicator}
                  variant={indicators.includes(indicator) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (indicators.includes(indicator)) {
                      setIndicators(indicators.filter(i => i !== indicator));
                    } else {
                      setIndicators([...indicators, indicator]);
                    }
                  }}
                  className="text-xs"
                >
                  {indicator}
                </Button>
              ))}
            </div>
          </div>

          {/* Pattern Alerts */}
          {patterns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Pattern Alerts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {patterns.map((pattern, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${
                      pattern.direction === 'bullish' 
                        ? 'bg-green-900/30 border-green-600' 
                        : pattern.direction === 'bearish'
                        ? 'bg-red-900/30 border-red-600'
                        : 'bg-gray-800/30 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">
                        {pattern.pattern}
                      </span>
                      <div className="flex items-center space-x-1">
                        {pattern.direction === 'bullish' && <TrendingUp className="h-3 w-3 text-green-400" />}
                        {pattern.direction === 'bearish' && <TrendingDown className="h-3 w-3 text-red-400" />}
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {Math.round(pattern.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{pattern.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}