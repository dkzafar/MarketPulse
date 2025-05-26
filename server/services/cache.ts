// Cache service to retrieve asset data from your comprehensive 13-API system
import axios from 'axios';

export async function getCachedAssetData(symbol: string) {
  try {
    // Get data from your existing market-data endpoint that serves 642 assets
    const response = await axios.get('http://localhost:5000/api/market-data');
    const allAssets = response.data;
    
    // Find the specific symbol in your comprehensive asset data
    const asset = allAssets.find((a: any) => 
      a.symbol === symbol || 
      a.symbol === symbol.toUpperCase() ||
      a.name?.includes(symbol)
    );
    
    if (!asset) {
      return null;
    }

    // Convert to expected format with OHLCV structure for analysis
    const ohlcv = [{
      open: asset.price,
      high: asset.price * 1.02, // Approximate high from current price
      low: asset.price * 0.98,  // Approximate low from current price
      close: asset.price,
      volume: asset.volume || 1000000
    }];

    return {
      symbol: asset.symbol,
      price: asset.price,
      change: asset.change,
      changePercent: asset.changePercent,
      volume: asset.volume,
      marketCap: asset.marketCap,
      ohlcv: ohlcv,
      assetClass: asset.category || 'stock'
    };
  } catch (error) {
    console.error('Error getting cached asset data:', error);
    return null;
  }
}