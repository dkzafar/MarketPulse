import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

interface StressTestRequest {
  positions: { [symbol: string]: number };
  scenarios?: string[];
  monteCarloRuns?: number;
  timeHorizon?: number;
}

interface StressTestResponse {
  timestamp: string;
  portfolio_summary: {
    total_positions: number;
    symbols: string[];
    position_sizes: { [symbol: string]: number };
  };
  baseline_statistics: any;
  stress_scenarios: any;
  monte_carlo_analysis: any;
  risk_summary: {
    worst_case_scenario: string;
    best_case_scenario: string;
    average_stress_loss: number;
  };
}

// POST /api/stress-test
router.post('/stress-test', async (req, res) => {
  try {
    const { positions, scenarios, monteCarloRuns, timeHorizon }: StressTestRequest = req.body;

    if (!positions || typeof positions !== 'object' || Object.keys(positions).length === 0) {
      return res.status(400).json({ 
        error: 'Positions object is required and must contain at least one position' 
      });
    }

    // Validate position values are numbers
    for (const [symbol, position] of Object.entries(positions)) {
      if (typeof position !== 'number' || isNaN(position)) {
        return res.status(400).json({ 
          error: `Invalid position size for ${symbol}: must be a number` 
        });
      }
    }

    // Run Python stress testing script
    const stressTestResults = await runPythonStressTest(positions);
    
    if (stressTestResults.error) {
      return res.status(500).json(stressTestResults);
    }

    res.json(stressTestResults);

  } catch (error: any) {
    console.error('Stress test API error:', error.message);
    res.status(500).json({ 
      error: 'Stress test failed', 
      details: error.message 
    });
  }
});

// GET /api/stress-test/scenarios
router.get('/stress-test/scenarios', async (req, res) => {
  try {
    const scenarios = {
      "market_crash_2008": { 
        description: "2008 Financial Crisis - 40% equity drop, 2.5x volatility spike",
        equity_shock: -0.40, 
        volatility_spike: 2.5 
      },
      "covid_crash_2020": { 
        description: "COVID-19 Market Crash - 35% equity drop, 3x volatility spike",
        equity_shock: -0.35, 
        volatility_spike: 3.0 
      },
      "black_monday_1987": { 
        description: "Black Monday 1987 - 22% single-day crash, 4x volatility spike",
        equity_shock: -0.22, 
        volatility_spike: 4.0 
      },
      "tech_bubble_2000": { 
        description: "Dot-com Bubble Burst - 30% tech crash, 2x volatility spike",
        equity_shock: -0.30, 
        volatility_spike: 2.0 
      },
      "moderate_correction": { 
        description: "Moderate Market Correction - 15% drop, 1.5x volatility spike",
        equity_shock: -0.15, 
        volatility_spike: 1.5 
      },
      "severe_correction": { 
        description: "Severe Market Correction - 25% drop, 2x volatility spike",
        equity_shock: -0.25, 
        volatility_spike: 2.0 
      },
      "flash_crash": { 
        description: "Flash Crash Event - 10% instant drop, 5x volatility spike",
        equity_shock: -0.10, 
        volatility_spike: 5.0 
      },
      "currency_crisis": { 
        description: "Currency Crisis - 20% forex shock, 2.5x volatility spike",
        forex_shock: -0.20, 
        volatility_spike: 2.5 
      },
      "commodity_collapse": { 
        description: "Commodity Market Collapse - 30% commodity drop",
        commodity_shock: -0.30, 
        volatility_spike: 2.0 
      },
      "interest_rate_shock": { 
        description: "Interest Rate Shock - 200bp rate increase",
        rate_shock: 0.02, 
        volatility_spike: 1.8 
      },
      "bull_market_rally": { 
        description: "Bull Market Rally - 15% equity surge, reduced volatility",
        equity_shock: 0.15, 
        volatility_spike: 0.8 
      },
      "crypto_winter": { 
        description: "Crypto Winter - 60% crypto crash, 3.5x volatility spike",
        crypto_shock: -0.60, 
        volatility_spike: 3.5 
      }
    };

    res.json({
      scenarios,
      total_scenarios: Object.keys(scenarios).length,
      categories: ['equity', 'crypto', 'forex', 'commodity', 'interest_rate']
    });

  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch stress test scenarios', 
      details: error.message 
    });
  }
});

// POST /api/stress-test/custom-scenario
router.post('/stress-test/custom-scenario', async (req, res) => {
  try {
    const { positions, customScenario } = req.body;

    if (!positions || !customScenario) {
      return res.status(400).json({ 
        error: 'Both positions and customScenario are required' 
      });
    }

    // Validate custom scenario structure
    const requiredFields = ['equity_shock', 'volatility_spike'];
    for (const field of requiredFields) {
      if (typeof customScenario[field] !== 'number') {
        return res.status(400).json({ 
          error: `Custom scenario must include ${field} as a number` 
        });
      }
    }

    // For custom scenarios, we'll modify the positions JSON to include scenario data
    const customPositions = {
      ...positions,
      __custom_scenario: customScenario
    };

    const stressTestResults = await runPythonStressTest(customPositions);
    
    res.json(stressTestResults);

  } catch (error: any) {
    console.error('Custom stress test error:', error.message);
    res.status(500).json({ 
      error: 'Custom stress test failed', 
      details: error.message 
    });
  }
});

/**
 * Execute Python stress testing script with portfolio positions
 */
function runPythonStressTest(positions: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../services/stress-test.py');
    const positionsJson = JSON.stringify(positions);
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [scriptPath, positionsJson], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: path.join(__dirname, '../services') }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stress test stderr:', stderr);
        resolve({ 
          error: 'Python stress test execution failed', 
          details: stderr || 'Unknown Python error',
          exit_code: code 
        });
        return;
      }

      try {
        const results = JSON.parse(stdout);
        resolve(results);
      } catch (parseError) {
        console.error('Failed to parse Python output:', stdout);
        resolve({ 
          error: 'Failed to parse stress test results', 
          details: 'Invalid JSON output from Python script',
          raw_output: stdout.substring(0, 500) // First 500 chars for debugging
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error);
      resolve({ 
        error: 'Failed to execute Python stress test', 
        details: error.message 
      });
    });

    // Set timeout to prevent hanging
    setTimeout(() => {
      pythonProcess.kill();
      resolve({ 
        error: 'Stress test timeout', 
        details: 'Python script execution exceeded 60 seconds' 
      });
    }, 60000);
  });
}

export default router;