// Direct test of Bitcoin analysis to show detailed crypto-specific insights
const { advancedAssetAnalyzer } = require('./server/advanced-asset-analyzer.ts');

// Test Bitcoin analysis with real-world context
const symbol = 'BTC';
const category = 'crypto';
const currentPrice = 95000;
const technicalData = {
  rsi: 65,
  currentPrice: currentPrice,
  sma20: 92000,
  support: 90000,
  resistance: 98000
};

console.log('=== TESTING BITCOIN ANALYSIS ===');
console.log('Symbol:', symbol);
console.log('Category:', category);
console.log('Price:', currentPrice);

try {
  const bitcoinIntelligence = advancedAssetAnalyzer.getSpecificAssetIntelligence(
    symbol, 
    category, 
    currentPrice, 
    technicalData
  );
  
  console.log('\n=== BITCOIN SPECIFIC INTELLIGENCE ===');
  console.log('Name:', bitcoinIntelligence.name);
  console.log('Real-World Context:', bitcoinIntelligence.realWorldContext);
  console.log('\nCurrent Factors:');
  bitcoinIntelligence.currentFactors.forEach((factor, index) => {
    console.log(`${index + 1}. ${factor}`);
  });
  
  console.log('\n=== RSI ANALYSIS FOR BITCOIN ===');
  console.log('RSI Value:', technicalData.rsi);
  console.log('Bitcoin RSI Meaning:', bitcoinIntelligence.rsiMeaning.neutral);
  
  console.log('\n=== BITCOIN PRICE ACTION ANALYSIS ===');
  bitcoinIntelligence.priceAction.forEach((action, index) => {
    console.log(`${index + 1}. ${action}`);
  });
  
  console.log('\n=== STEP-BY-STEP BITCOIN ANALYSIS ===');
  bitcoinIntelligence.stepByStepAnalysis.forEach((step, index) => {
    console.log(`\nStep ${step.step}: ${step.title}`);
    console.log(`Analysis: ${step.analysis}`);
    console.log(`Meaning: ${step.meaning}`);
    console.log(`Action: ${step.action}`);
  });
  
} catch (error) {
  console.error('Error testing Bitcoin analysis:', error);
}