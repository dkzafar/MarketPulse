#!/usr/bin/env python3
"""
Professional Risk Management Stress Testing Tool
Integrates with authentic trading platform data for institutional-grade risk analysis
"""

import json
import sys
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from scipy import stats

class PortfolioStressTester:
    """
    Professional stress testing engine for portfolio risk management
    Uses authentic market data from your 632-asset trading platform
    """
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.trading_days_per_year = 252
        
        # Predefined stress scenarios (institutional standard)
        self.stress_scenarios = {
            "market_crash_2008": {"equity_shock": -0.40, "volatility_spike": 2.5},
            "covid_crash_2020": {"equity_shock": -0.35, "volatility_spike": 3.0},
            "black_monday_1987": {"equity_shock": -0.22, "volatility_spike": 4.0},
            "tech_bubble_2000": {"equity_shock": -0.30, "volatility_spike": 2.0},
            "moderate_correction": {"equity_shock": -0.15, "volatility_spike": 1.5},
            "severe_correction": {"equity_shock": -0.25, "volatility_spike": 2.0},
            "flash_crash": {"equity_shock": -0.10, "volatility_spike": 5.0},
            "currency_crisis": {"forex_shock": -0.20, "volatility_spike": 2.5},
            "commodity_collapse": {"commodity_shock": -0.30, "volatility_spike": 2.0},
            "interest_rate_shock": {"rate_shock": 0.02, "volatility_spike": 1.8},
            "bull_market_rally": {"equity_shock": 0.15, "volatility_spike": 0.8},
            "crypto_winter": {"crypto_shock": -0.60, "volatility_spike": 3.5}
        }
    
    def fetch_authentic_market_data(self) -> pd.DataFrame:
        """
        Fetch authentic market data from your 632-asset trading platform
        """
        try:
            response = requests.get(f"{self.base_url}/api/market-data", timeout=30)
            response.raise_for_status()
            
            market_data = response.json()
            df = pd.DataFrame(market_data)
            
            # Ensure required columns exist
            required_columns = ['symbol', 'price', 'changePercent', 'category']
            for col in required_columns:
                if col not in df.columns:
                    df[col] = 0.0 if col in ['price', 'changePercent'] else 'Unknown'
            
            return df
            
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch authentic market data: {str(e)}")
    
    def generate_historical_ohlcv(self, symbol: str, current_price: float, 
                                 volatility: float = 0.25, days: int = 252) -> pd.DataFrame:
        """
        Generate realistic historical OHLCV data based on current market conditions
        Uses authentic price and volatility characteristics
        """
        np.random.seed(42)  # Reproducible results
        
        dates = pd.date_range(end=datetime.now(), periods=days, freq='D')
        
        # Generate realistic price movements
        daily_returns = np.random.normal(0, volatility/np.sqrt(self.trading_days_per_year), days)
        
        # Start from a base price and walk forward
        base_price = current_price / (1 + np.cumsum(daily_returns)[-1])
        prices = base_price * np.exp(np.cumsum(daily_returns))
        
        # Generate OHLC from close prices with realistic spreads
        ohlc_data = []
        for i, price in enumerate(prices):
            daily_vol = volatility * price / np.sqrt(self.trading_days_per_year)
            
            # Realistic intraday movements
            high = price * (1 + abs(np.random.normal(0, daily_vol/price * 0.5)))
            low = price * (1 - abs(np.random.normal(0, daily_vol/price * 0.5)))
            open_price = prices[i-1] if i > 0 else price
            
            # Ensure OHLC relationships are valid
            high = max(high, price, open_price)
            low = min(low, price, open_price)
            
            volume = int(np.random.lognormal(15, 1))  # Realistic volume distribution
            
            ohlc_data.append({
                'date': dates[i],
                'open': open_price,
                'high': high,
                'low': low,
                'close': price,
                'volume': volume
            })
        
        return pd.DataFrame(ohlc_data)
    
    def calculate_portfolio_statistics(self, returns: np.ndarray) -> Dict:
        """
        Calculate comprehensive portfolio risk statistics
        """
        if len(returns) == 0:
            return {"error": "No returns data available"}
        
        returns_clean = returns[~np.isnan(returns)]
        
        if len(returns_clean) == 0:
            return {"error": "No valid returns data"}
        
        # Basic statistics
        total_return = np.prod(1 + returns_clean) - 1
        annualized_return = (1 + total_return) ** (self.trading_days_per_year / len(returns_clean)) - 1
        volatility = np.std(returns_clean) * np.sqrt(self.trading_days_per_year)
        
        # Risk metrics
        var_95 = np.percentile(returns_clean, 5)
        var_99 = np.percentile(returns_clean, 1)
        cvar_95 = np.mean(returns_clean[returns_clean <= var_95])
        
        # Maximum drawdown
        cumulative_returns = np.cumprod(1 + returns_clean)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdowns)
        
        # Sharpe ratio (assuming 2% risk-free rate)
        risk_free_rate = 0.02
        sharpe_ratio = (annualized_return - risk_free_rate) / volatility if volatility > 0 else 0
        
        # Sortino ratio (downside deviation)
        downside_returns = returns_clean[returns_clean < 0]
        downside_deviation = np.std(downside_returns) * np.sqrt(self.trading_days_per_year) if len(downside_returns) > 0 else 0
        sortino_ratio = (annualized_return - risk_free_rate) / downside_deviation if downside_deviation > 0 else 0
        
        return {
            "total_return": total_return,
            "annualized_return": annualized_return,
            "volatility": volatility,
            "sharpe_ratio": sharpe_ratio,
            "sortino_ratio": sortino_ratio,
            "var_95": var_95,
            "var_99": var_99,
            "cvar_95": cvar_95,
            "max_drawdown": max_drawdown,
            "skewness": stats.skew(returns_clean),
            "kurtosis": stats.kurtosis(returns_clean)
        }
    
    def apply_stress_scenario(self, portfolio_data: pd.DataFrame, 
                            scenario_name: str, positions: Dict[str, float]) -> Dict:
        """
        Apply stress scenario to portfolio and calculate impact
        """
        scenario = self.stress_scenarios.get(scenario_name, {})
        if not scenario:
            return {"error": f"Unknown scenario: {scenario_name}"}
        
        stressed_portfolio = portfolio_data.copy()
        stress_results = {}
        
        # Apply shocks based on asset categories
        for symbol, position_size in positions.items():
            if symbol not in portfolio_data['symbol'].values:
                continue
                
            asset_row = portfolio_data[portfolio_data['symbol'] == symbol].iloc[0]
            original_price = asset_row['price']
            category = asset_row.get('category', 'Unknown').lower()
            
            # Determine appropriate shock based on asset category
            shock = 0.0
            if 'equity_shock' in scenario and any(cat in category for cat in ['stock', 'equity', 'etf']):
                shock = scenario['equity_shock']
            elif 'crypto_shock' in scenario and 'crypto' in category:
                shock = scenario['crypto_shock']
            elif 'forex_shock' in scenario and 'forex' in category:
                shock = scenario['forex_shock']
            elif 'commodity_shock' in scenario and 'commodity' in category:
                shock = scenario['commodity_shock']
            elif 'equity_shock' in scenario:  # Default to equity shock for unknown categories
                shock = scenario['equity_shock'] * 0.5  # Reduced impact
            
            # Apply shock to price
            stressed_price = original_price * (1 + shock)
            
            # Calculate P&L for this position
            pnl = position_size * (stressed_price - original_price)
            
            stress_results[symbol] = {
                "original_price": original_price,
                "stressed_price": stressed_price,
                "shock_applied": shock,
                "position_size": position_size,
                "pnl": pnl,
                "category": category
            }
        
        # Calculate total portfolio impact
        total_pnl = sum(result['pnl'] for result in stress_results.values())
        total_exposure = sum(abs(position) * portfolio_data[portfolio_data['symbol'] == symbol]['price'].iloc[0] 
                           for symbol, position in positions.items() 
                           if symbol in portfolio_data['symbol'].values)
        
        portfolio_return = total_pnl / total_exposure if total_exposure > 0 else 0
        
        return {
            "scenario_name": scenario_name,
            "scenario_parameters": scenario,
            "total_pnl": total_pnl,
            "portfolio_return": portfolio_return,
            "total_exposure": total_exposure,
            "individual_results": stress_results
        }
    
    def monte_carlo_simulation(self, portfolio_data: pd.DataFrame, 
                             positions: Dict[str, float], 
                             num_simulations: int = 10000, 
                             time_horizon: int = 22) -> Dict:
        """
        Run Monte Carlo simulation for portfolio VaR calculation
        """
        portfolio_values = []
        
        for _ in range(num_simulations):
            total_value = 0
            
            for symbol, position_size in positions.items():
                if symbol not in portfolio_data['symbol'].values:
                    continue
                    
                asset_row = portfolio_data[portfolio_data['symbol'] == symbol].iloc[0]
                current_price = asset_row['price']
                
                # Estimate volatility from recent price change
                daily_vol = abs(asset_row.get('changePercent', 2.0)) / 100 / np.sqrt(self.trading_days_per_year)
                
                # Generate random price path
                returns = np.random.normal(0, daily_vol, time_horizon)
                final_price = current_price * np.exp(np.sum(returns))
                
                total_value += position_size * final_price
            
            portfolio_values.append(total_value)
        
        portfolio_values = np.array(portfolio_values)
        initial_value = sum(positions[symbol] * portfolio_data[portfolio_data['symbol'] == symbol]['price'].iloc[0]
                          for symbol in positions.keys() 
                          if symbol in portfolio_data['symbol'].values)
        
        returns = (portfolio_values - initial_value) / initial_value
        
        return {
            "monte_carlo_var_95": np.percentile(returns, 5),
            "monte_carlo_var_99": np.percentile(returns, 1),
            "expected_return": np.mean(returns),
            "expected_volatility": np.std(returns),
            "simulations": num_simulations,
            "time_horizon_days": time_horizon
        }
    
    def run_comprehensive_stress_test(self, positions: Dict[str, float]) -> Dict:
        """
        Run comprehensive stress testing analysis
        """
        try:
            # Fetch authentic market data
            market_data = self.fetch_authentic_market_data()
            
            # Validate positions against available symbols
            valid_positions = {}
            for symbol, position in positions.items():
                if symbol in market_data['symbol'].values:
                    valid_positions[symbol] = position
                else:
                    print(f"Warning: Symbol {symbol} not found in market data")
            
            if not valid_positions:
                return {"error": "No valid positions found in market data"}
            
            # Calculate baseline portfolio statistics
            baseline_returns = []
            for symbol, position in valid_positions.items():
                asset_data = market_data[market_data['symbol'] == symbol].iloc[0]
                change_percent = asset_data.get('changePercent', 0) / 100
                baseline_returns.append(change_percent)
            
            baseline_stats = self.calculate_portfolio_statistics(np.array(baseline_returns))
            
            # Run stress scenarios
            scenario_results = {}
            for scenario_name in self.stress_scenarios.keys():
                scenario_results[scenario_name] = self.apply_stress_scenario(
                    market_data, scenario_name, valid_positions
                )
            
            # Run Monte Carlo simulation
            monte_carlo_results = self.monte_carlo_simulation(market_data, valid_positions)
            
            # Compile comprehensive report
            report = {
                "timestamp": datetime.now().isoformat(),
                "portfolio_summary": {
                    "total_positions": len(valid_positions),
                    "symbols": list(valid_positions.keys()),
                    "position_sizes": valid_positions
                },
                "baseline_statistics": baseline_stats,
                "stress_scenarios": scenario_results,
                "monte_carlo_analysis": monte_carlo_results,
                "risk_summary": {
                    "worst_case_scenario": min(scenario_results.keys(), 
                                             key=lambda x: scenario_results[x].get('portfolio_return', 0)),
                    "best_case_scenario": max(scenario_results.keys(), 
                                            key=lambda x: scenario_results[x].get('portfolio_return', 0)),
                    "average_stress_loss": np.mean([result.get('portfolio_return', 0) 
                                                  for result in scenario_results.values()])
                }
            }
            
            return report
            
        except Exception as e:
            return {"error": f"Stress test failed: {str(e)}"}

def main():
    """
    CLI interface for stress testing
    """
    if len(sys.argv) < 2:
        print("Usage: python stress-test.py '<positions_json>'")
        print("Example: python stress-test.py '{\"AAPL\": 1000, \"MSFT\": 800, \"GOOGL\": 500}'")
        sys.exit(1)
    
    try:
        positions = json.loads(sys.argv[1])
        
        stress_tester = PortfolioStressTester()
        results = stress_tester.run_comprehensive_stress_test(positions)
        
        print(json.dumps(results, indent=2, default=str))
        
    except json.JSONDecodeError:
        print("Error: Invalid JSON format for positions")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()