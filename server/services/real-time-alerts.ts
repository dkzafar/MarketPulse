/**
 * Real-Time Price Alerts & Notification System
 * Professional alert management with WebSocket integration
 */

import { EventEmitter } from 'events';

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  alertType: 'price_above' | 'price_below' | 'price_change' | 'volume_spike' | 'pattern_detected';
  condition: {
    targetPrice?: number;
    changePercent?: number;
    volumeThreshold?: number;
    pattern?: string;
  };
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: Date;
  createdAt: Date;
  message: string;
  notificationMethods: ('email' | 'sms' | 'push' | 'websocket')[];
}

export interface MarketScanner {
  id: string;
  name: string;
  filters: {
    priceRange?: { min: number; max: number };
    volumeMin?: number;
    changePercent?: { min: number; max: number };
    marketCap?: { min: number; max: number };
    sectors?: string[];
    exchanges?: string[];
  };
  isActive: boolean;
  results: ScanResult[];
  lastScan?: Date;
}

export interface ScanResult {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  matchedCriteria: string[];
  score: number;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  symbol: string;
  message: string;
  currentPrice: number;
  triggeredAt: Date;
  severity: 'low' | 'medium' | 'high';
  data?: any;
}

class AlertManager extends EventEmitter {
  private alerts: Map<string, PriceAlert> = new Map();
  private scanners: Map<string, MarketScanner> = new Map();
  private notifications: AlertNotification[] = [];
  private priceCache: Map<string, { price: number; volume: number; timestamp: Date }> = new Map();

  constructor() {
    super();
    this.startAlertMonitoring();
  }

  /**
   * Create a new price alert
   */
  createAlert(alert: Omit<PriceAlert, 'id' | 'isActive' | 'triggerCount' | 'createdAt'>): PriceAlert {
    const newAlert: PriceAlert = {
      ...alert,
      id: this.generateId(),
      isActive: true,
      triggerCount: 0,
      createdAt: new Date()
    };

    this.alerts.set(newAlert.id, newAlert);
    this.emit('alertCreated', newAlert);
    
    return newAlert;
  }

  /**
   * Update market data and check for triggered alerts
   */
  updateMarketData(symbol: string, price: number, volume: number = 0) {
    const previousData = this.priceCache.get(symbol);
    const currentData = { price, volume, timestamp: new Date() };
    
    this.priceCache.set(symbol, currentData);

    // Check all active alerts for this symbol
    const symbolAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.symbol === symbol && alert.isActive
    );

    for (const alert of symbolAlerts) {
      if (this.checkAlertCondition(alert, currentData, previousData)) {
        this.triggerAlert(alert, currentData);
      }
    }

    // Update active scanners
    this.updateScanResults(symbol, currentData);
  }

  /**
   * Check if alert condition is met
   */
  private checkAlertCondition(
    alert: PriceAlert, 
    current: { price: number; volume: number; timestamp: Date },
    previous?: { price: number; volume: number; timestamp: Date }
  ): boolean {
    const { alertType, condition } = alert;
    const { price, volume } = current;

    switch (alertType) {
      case 'price_above':
        return condition.targetPrice !== undefined && price >= condition.targetPrice;
      
      case 'price_below':
        return condition.targetPrice !== undefined && price <= condition.targetPrice;
      
      case 'price_change':
        if (!previous || !condition.changePercent) return false;
        const changePercent = ((price - previous.price) / previous.price) * 100;
        return Math.abs(changePercent) >= Math.abs(condition.changePercent);
      
      case 'volume_spike':
        if (!previous || !condition.volumeThreshold) return false;
        const volumeIncrease = volume / previous.volume;
        return volumeIncrease >= condition.volumeThreshold;
      
      case 'pattern_detected':
        // This would integrate with pattern recognition service
        return false; // Simplified for now
      
      default:
        return false;
    }
  }

  /**
   * Trigger an alert and send notifications
   */
  private triggerAlert(alert: PriceAlert, data: { price: number; volume: number; timestamp: Date }) {
    alert.triggerCount++;
    alert.lastTriggered = new Date();

    const notification: AlertNotification = {
      id: this.generateId(),
      alertId: alert.id,
      symbol: alert.symbol,
      message: this.generateAlertMessage(alert, data),
      currentPrice: data.price,
      triggeredAt: new Date(),
      severity: this.calculateSeverity(alert),
      data
    };

    this.notifications.unshift(notification);
    this.notifications = this.notifications.slice(0, 1000); // Keep last 1000 notifications

    // Send notifications via different methods
    this.sendNotifications(alert, notification);

    this.emit('alertTriggered', { alert, notification, data });
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(alert: PriceAlert, data: { price: number }): string {
    const { symbol, alertType, condition } = alert;
    const { price } = data;

    switch (alertType) {
      case 'price_above':
        return `${symbol} has risen above $${condition.targetPrice} (Current: $${price.toFixed(2)})`;
      case 'price_below':
        return `${symbol} has fallen below $${condition.targetPrice} (Current: $${price.toFixed(2)})`;
      case 'price_change':
        return `${symbol} has significant price movement (Current: $${price.toFixed(2)})`;
      case 'volume_spike':
        return `${symbol} experiencing unusual volume activity (Current: $${price.toFixed(2)})`;
      default:
        return `${symbol} alert triggered (Current: $${price.toFixed(2)})`;
    }
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(alert: PriceAlert): 'low' | 'medium' | 'high' {
    if (alert.alertType === 'volume_spike') return 'high';
    if (alert.alertType === 'price_change' && (alert.condition.changePercent || 0) > 10) return 'high';
    if (alert.triggerCount === 1) return 'medium';
    return 'low';
  }

  /**
   * Send notifications via configured methods
   */
  private sendNotifications(alert: PriceAlert, notification: AlertNotification) {
    for (const method of alert.notificationMethods) {
      switch (method) {
        case 'websocket':
          this.emit('websocketNotification', { alert, notification });
          break;
        case 'email':
          this.sendEmailNotification(alert, notification);
          break;
        case 'sms':
          this.sendSMSNotification(alert, notification);
          break;
        case 'push':
          this.sendPushNotification(alert, notification);
          break;
      }
    }
  }

  /**
   * Create market scanner
   */
  createScanner(scanner: Omit<MarketScanner, 'id' | 'isActive' | 'results'>): MarketScanner {
    const newScanner: MarketScanner = {
      ...scanner,
      id: this.generateId(),
      isActive: true,
      results: []
    };

    this.scanners.set(newScanner.id, newScanner);
    return newScanner;
  }

  /**
   * Run market scan
   */
  async runMarketScan(scannerId: string, marketData: { symbol: string; price: number; volume: number; marketCap?: number }[]): Promise<ScanResult[]> {
    const scanner = this.scanners.get(scannerId);
    if (!scanner || !scanner.isActive) return [];

    const results: ScanResult[] = [];

    for (const data of marketData) {
      const score = this.calculateScanScore(data, scanner.filters);
      
      if (score > 0) {
        const matchedCriteria = this.getMatchedCriteria(data, scanner.filters);
        
        results.push({
          symbol: data.symbol,
          price: data.price,
          change: 0, // Would calculate from previous data
          changePercent: 0, // Would calculate from previous data
          volume: data.volume,
          marketCap: data.marketCap,
          matchedCriteria,
          score
        });
      }
    }

    // Sort by score and keep top results
    const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, 50);
    
    scanner.results = sortedResults;
    scanner.lastScan = new Date();

    this.emit('scanCompleted', { scanner, results: sortedResults });
    
    return sortedResults;
  }

  /**
   * Calculate scan score for filtering
   */
  private calculateScanScore(data: any, filters: MarketScanner['filters']): number {
    let score = 0;

    // Price range check
    if (filters.priceRange) {
      if (data.price >= filters.priceRange.min && data.price <= filters.priceRange.max) {
        score += 10;
      } else {
        return 0; // Hard requirement
      }
    }

    // Volume check
    if (filters.volumeMin && data.volume >= filters.volumeMin) {
      score += 15;
    }

    // Market cap check
    if (filters.marketCap && data.marketCap) {
      if (data.marketCap >= filters.marketCap.min && 
          (!filters.marketCap.max || data.marketCap <= filters.marketCap.max)) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Get matched criteria for display
   */
  private getMatchedCriteria(data: any, filters: MarketScanner['filters']): string[] {
    const criteria: string[] = [];

    if (filters.priceRange && data.price >= filters.priceRange.min && data.price <= filters.priceRange.max) {
      criteria.push(`Price: $${filters.priceRange.min}-$${filters.priceRange.max}`);
    }

    if (filters.volumeMin && data.volume >= filters.volumeMin) {
      criteria.push(`Volume > ${filters.volumeMin.toLocaleString()}`);
    }

    if (filters.marketCap && data.marketCap && data.marketCap >= filters.marketCap.min) {
      criteria.push(`Market Cap > $${(filters.marketCap.min / 1e9).toFixed(1)}B`);
    }

    return criteria;
  }

  /**
   * Update scan results with new market data
   */
  private updateScanResults(symbol: string, data: { price: number; volume: number }) {
    for (const scanner of this.scanners.values()) {
      if (!scanner.isActive) continue;

      const existingResult = scanner.results.find(r => r.symbol === symbol);
      if (existingResult) {
        const previousPrice = existingResult.price;
        existingResult.price = data.price;
        existingResult.change = data.price - previousPrice;
        existingResult.changePercent = ((data.price - previousPrice) / previousPrice) * 100;
        existingResult.volume = data.volume;
      }
    }
  }

  /**
   * Start monitoring alerts
   */
  private startAlertMonitoring() {
    // This would integrate with your real-time data feed
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up old notifications
   */
  private cleanupOldNotifications() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(n => n.triggeredAt > oneWeekAgo);
  }

  /**
   * Get user alerts
   */
  getUserAlerts(userId: string): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
  }

  /**
   * Get recent notifications
   */
  getRecentNotifications(userId: string, limit: number = 50): AlertNotification[] {
    return this.notifications
      .filter(n => {
        const alert = this.alerts.get(n.alertId);
        return alert?.userId === userId;
      })
      .slice(0, limit);
  }

  /**
   * Delete alert
   */
  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Toggle alert active status
   */
  toggleAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isActive = !alert.isActive;
      return true;
    }
    return false;
  }

  // Notification methods (would integrate with actual services)
  private async sendEmailNotification(alert: PriceAlert, notification: AlertNotification) {
    // Email integration would go here
    console.log(`Email notification: ${notification.message}`);
  }

  private async sendSMSNotification(alert: PriceAlert, notification: AlertNotification) {
    // SMS integration would go here (Twilio, etc.)
    console.log(`SMS notification: ${notification.message}`);
  }

  private async sendPushNotification(alert: PriceAlert, notification: AlertNotification) {
    // Push notification integration would go here
    console.log(`Push notification: ${notification.message}`);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();

// Common alert templates
export const AlertTemplates = {
  breakoutAlert: (symbol: string, price: number) => ({
    symbol,
    alertType: 'price_above' as const,
    condition: { targetPrice: price },
    message: `${symbol} breakout above $${price}`,
    notificationMethods: ['websocket', 'push'] as const
  }),

  stopLossAlert: (symbol: string, price: number) => ({
    symbol,
    alertType: 'price_below' as const,
    condition: { targetPrice: price },
    message: `${symbol} stop loss triggered at $${price}`,
    notificationMethods: ['websocket', 'email', 'sms'] as const
  }),

  volumeSpikeAlert: (symbol: string, threshold: number = 2) => ({
    symbol,
    alertType: 'volume_spike' as const,
    condition: { volumeThreshold: threshold },
    message: `${symbol} unusual volume activity detected`,
    notificationMethods: ['websocket', 'push'] as const
  })
};

// Common scanner templates
export const ScannerTemplates = {
  breakoutScanner: {
    name: 'Breakout Opportunities',
    filters: {
      priceRange: { min: 1, max: 1000 },
      volumeMin: 100000,
      changePercent: { min: 5, max: 50 }
    }
  },

  valueStocks: {
    name: 'Value Opportunities',
    filters: {
      priceRange: { min: 5, max: 100 },
      marketCap: { min: 100000000, max: 10000000000 }
    }
  },

  highVolume: {
    name: 'High Volume Activity',
    filters: {
      volumeMin: 1000000,
      changePercent: { min: 2, max: 100 }
    }
  }
};