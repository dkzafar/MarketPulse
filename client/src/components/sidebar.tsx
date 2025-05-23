import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Home, TrendingUp, Calculator, Newspaper, Settings, Star, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export default function Sidebar({ isOpen, onClose, selectedSymbol, onSymbolSelect }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const { watchlist, addToWatchlist, removeFromWatchlist, quotes } = useWatchlist();

  const { data: searchResults = [] } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: searchQuery.length > 1,
    staleTime: 30000,
  });

  const navItems = [
    { id: "summary", label: "Summary", icon: Home },
    { id: "charts", label: "Charts", icon: TrendingUp },
    { id: "indicators", label: "Indicators", icon: Calculator },
    { id: "news", label: "News", icon: Newspaper },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <TrendingUp className="text-primary text-2xl mr-3" />
          <h1 className="text-xl font-800 text-foreground">StockVue</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border focus:border-primary"
          />
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {searchResults.slice(0, 8).map((result) => (
                <button
                  key={result.symbol}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                  onClick={() => {
                    addToWatchlist(result.symbol);
                    setSearchQuery("");
                  }}
                >
                  <div className="font-600 text-foreground">{result.symbol}</div>
                  <div className="text-sm text-muted-foreground truncate">{result.name}</div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* Navigation Links */}
        <nav className="space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center w-full px-4 py-3 rounded-lg transition-colors font-600",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Watchlist */}
      <div className="flex-1 px-6 pb-6 border-t border-border pt-6">
        <h3 className="text-sm font-600 text-muted-foreground mb-4 uppercase tracking-wider">
          Watchlist
        </h3>
        <div className="space-y-2">
          {watchlist?.symbols.map((symbol) => {
            const quote = quotes?.find(q => q.symbol === symbol);
            const isSelected = symbol === selectedSymbol;
            const isPositive = quote ? quote.change >= 0 : true;
            
            return (
              <motion.div
                key={symbol}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200",
                  isSelected 
                    ? "bg-primary/20 border border-primary" 
                    : "hover:bg-muted"
                )}
                onClick={() => onSymbolSelect(symbol)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-600 text-foreground">{symbol}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(symbol);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {quote && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Company
                    </div>
                  )}
                </div>
                {quote && (
                  <div className="text-right ml-2">
                    <div className={cn(
                      "text-sm font-600",
                      isPositive ? "text-success" : "text-danger"
                    )}>
                      ${quote.price.toFixed(2)}
                    </div>
                    <div className={cn(
                      "text-xs",
                      isPositive ? "text-success" : "text-danger"
                    )}>
                      {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 z-50">
        <motion.div
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full"
        >
          {sidebarContent}
        </motion.div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
