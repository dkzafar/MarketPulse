import { AssetData, AISummary } from '../types';

export function verifySummary(assetData: AssetData, summary: AISummary): AISummary & { validation: any } {
  const validation = {
    signalConsistency: checkSignalConsistency(assetData, summary),
    priceTargetReasonable: checkPriceTarget(assetData, summary),
    riskAssessment: checkRiskAssessment(assetData, summary),
    confidenceValid: checkConfidenceLevel(summary),
    flags: [] as string[]
  };

  // Add flags for any validation issues
  if (!validation.signalConsistency) {
    validation.flags.push('Signal inconsistent with technical indicators');
  }
  
  if (!validation.priceTargetReasonable) {
    validation.flags.push('Price target seems unrealistic');
  }
  
  if (!validation.riskAssessment) {
    validation.flags.push('Risk assessment may be inaccurate');
  }
  
  if (!validation.confidenceValid) {
    validation.flags.push('Confidence level outside acceptable range');
  }

  return {
    ...summary,
    validation
  };
}

function checkSignalConsistency(assetData: AssetData, summary: AISummary): boolean {
  // Basic momentum check
  const priceChange = assetData.changePercent;
  
  if (summary.signal === 'BUY' && priceChange < -5) {
    return false; // BUY signal on strong downward momentum might be inconsistent
  }
  
  if (summary.signal === 'SELL' && priceChange > 5) {
    return false; // SELL signal on strong upward momentum might be inconsistent
  }
  
  return true;
}

function checkPriceTarget(assetData: AssetData, summary: AISummary): boolean {
  const currentPrice = assetData.price;
  const targetPrice = summary.exitPrice;
  
  const percentChange = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;
  
  // Flag if price target is more than 50% away from current price
  return percentChange <= 50;
}

function checkRiskAssessment(assetData: AssetData, summary: AISummary): boolean {
  const volatility = Math.abs(assetData.changePercent);
  
  // Check if risk profile matches volatility
  if (summary.riskProfile === 'low' && volatility > 5) {
    return false;
  }
  
  if (summary.riskProfile === 'high' && volatility < 1) {
    return false;
  }
  
  return true;
}

function checkConfidenceLevel(summary: AISummary): boolean {
  return summary.confidence >= 0 && summary.confidence <= 1;
}