import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisclaimerProps {
  onConsent: () => void;
  className?: string;
}

export default function Disclaimer({ onConsent, className }: DisclaimerProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleConsent = () => {
    if (acknowledged) {
      setIsVisible(false);
      onConsent();
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("fixed bottom-0 left-0 right-0 z-50 p-4", className)}
    >
      <Card className="bg-background/95 backdrop-blur-sm border-border shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground">
                  Important Financial Disclaimer
                </h3>
              </div>
            </div>

            {/* Main Disclaimer Text */}
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-foreground">Informational Purposes Only</span>
                </div>
                <p>
                  This analysis is provided for informational and educational purposes only. 
                  It is not intended as financial, investment, or trading advice.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-foreground">No Performance Guarantee</span>
                </div>
                <p>
                  Past performance does not guarantee future results. All investments carry risk 
                  of loss. AI models have limitations and may produce inaccurate predictions.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-foreground">Professional Advice</span>
                </div>
                <p>
                  Always consult with qualified financial professionals before making investment 
                  decisions. Consider your risk tolerance and financial situation.
                </p>
              </div>
            </div>

            {/* Detailed Terms */}
            <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
              <h4 className="font-medium text-foreground">Model Limitations & Risk Factors:</h4>
              <div className="grid md:grid-cols-2 gap-2">
                <ul className="space-y-1">
                  <li>• AI models are trained on historical data and may not predict future market conditions</li>
                  <li>• Technical indicators can produce false signals during volatile market periods</li>
                  <li>• News sentiment analysis may not capture all market-moving factors</li>
                </ul>
                <ul className="space-y-1">
                  <li>• Market conditions can change rapidly, affecting analysis validity</li>
                  <li>• Cryptocurrency and forex markets are particularly volatile and risky</li>
                  <li>• External factors (geopolitical events, regulations) may impact predictions</li>
                </ul>
              </div>
            </div>

            {/* Acknowledgment Section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="disclaimer-acknowledgment"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="disclaimer-acknowledgment"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    I acknowledge and understand that:
                  </label>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <p>• This analysis is not financial advice and I should not rely solely on it for investment decisions</p>
                    <p>• I understand the risks associated with trading and investing in financial markets</p>
                    <p>• I will conduct my own research and/or consult with financial professionals before making decisions</p>
                    <p>• I am using this platform at my own risk and the developers are not liable for any losses</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our terms and acknowledge the risks involved in financial markets.
                </p>
                <Button
                  onClick={handleConsent}
                  disabled={!acknowledged}
                  className={cn(
                    "transition-all duration-200",
                    acknowledged 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {acknowledged ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Continue to Analysis
                    </>
                  ) : (
                    "Please acknowledge to continue"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Optional: Simplified version for inline use
export function InlineDisclaimer({ onConsent, className }: DisclaimerProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConsent = () => {
    if (acknowledged) {
      onConsent();
    }
  };

  return (
    <div className={cn("bg-muted/30 border border-border rounded-lg p-4", className)}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-sm font-medium text-foreground">Financial Disclaimer</h4>
            <p className="text-xs text-muted-foreground mt-1">
              This analysis is for informational purposes only and is not financial advice. 
              Past performance does not guarantee future results. Please consult with financial 
              professionals before making investment decisions.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inline-disclaimer"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
            />
            <label htmlFor="inline-disclaimer" className="text-xs text-foreground cursor-pointer">
              I acknowledge this is not financial advice
            </label>
          </div>
          
          <Button
            onClick={handleConsent}
            disabled={!acknowledged}
            size="sm"
            className="w-full"
          >
            View Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}