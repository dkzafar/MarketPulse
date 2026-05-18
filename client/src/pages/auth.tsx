import { useState } from "react";
import LoginForm from "@/components/login-form";
import SimpleRegister from "@/components/simple-register";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">TradingPro</h1>
          <p className="text-slate-400">Professional Stock Analysis Platform</p>
        </div>

        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <SimpleRegister
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}

        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>🚀 Start with $10,000 virtual money</p>
          <p>📊 Real-time market data & AI insights</p>
          <p>🎯 Advanced technical indicators</p>
        </div>
      </div>
    </div>
  );
}