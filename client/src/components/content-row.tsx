import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContentRowProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  onSeeAll?: () => void;
  loading?: boolean;
}

export default function ContentRow({ title, icon, children, onSeeAll, loading }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 700 : -700, behavior: 'smooth' });
  };

  return (
    <div className="mb-8 group/row">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {onSeeAll && (
            <button
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors mr-2"
              onClick={onSeeAll}
            >
              See all →
            </button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-44 h-44 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          {children}
        </div>
      )}
    </div>
  );
}
