import PortfolioOverview from "@/components/portfolio-overview";

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio Management</h1>
          <p className="text-muted-foreground">Track your stock positions and analyze your investment performance</p>
        </div>
        <PortfolioOverview />
      </div>
    </div>
  );
}