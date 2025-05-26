import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Portfolio from "@/pages/portfolio";
import Markets from "@/pages/markets-new";
import AIChat from "@/pages/ai-chat";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import MobileNav from "@/components/mobile-nav";

function ProtectedRoute({ component: Component, ...props }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return <Component {...props} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="flex">
      {isAuthenticated && <MobileNav />}
      <div className={`flex-1 ${isAuthenticated ? 'lg:ml-64 pb-16 lg:pb-0' : ''}`}>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/portfolio">
            <ProtectedRoute component={Portfolio} />
          </Route>
          <Route path="/markets">
            <ProtectedRoute component={Markets} />
          </Route>
          <Route path="/markets-new">
            <ProtectedRoute component={Markets} />
          </Route>
          <Route path="/ai-chat">
            <ProtectedRoute component={AIChat} />
          </Route>
          <Route path="/">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground font-montserrat">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
