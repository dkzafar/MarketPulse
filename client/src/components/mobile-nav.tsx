import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, PieChart, TrendingUp, Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home',      href: '/',          icon: Home,      label: 'Home' },
  { name: 'Portfolio', href: '/portfolio',  icon: PieChart,  label: 'Portfolio' },
  { name: 'Markets',   href: '/markets',    icon: TrendingUp,label: 'Markets' },
  { name: 'AI Chat',   href: '/ai-chat',    icon: Brain,     label: 'AI' },
  { name: 'Profile',   href: '/profile',    icon: User,      label: 'Profile' },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Bottom Navigation Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t lg:hidden">
        <div className="flex h-16 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === '/' && location === '/dashboard');
            
            return (
              <Link key={item.name} href={item.href} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center h-full space-y-1 transition-colors relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-xs font-medium transition-all",
                    isActive && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-background/95 lg:backdrop-blur lg:border-r">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">StockVue</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href === '/' && location === '/dashboard');
              
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/50">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">testuser123</p>
                <p className="text-xs text-muted-foreground">Trading Account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}