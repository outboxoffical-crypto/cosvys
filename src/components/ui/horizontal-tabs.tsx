import * as React from "react";
import { cn } from "@/lib/utils";

interface HorizontalTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onAddCategory?: () => void;
  className?: string;
}

export function HorizontalTabs({
  categories,
  activeCategory,
  onCategoryChange,
  onAddCategory,
  className,
}: HorizontalTabsProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  // Center active tab when it changes
  React.useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeTab = activeTabRef.current;
      
      const containerWidth = container.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      
      const scrollPosition = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [activeCategory]);

  // Mouse drag scroll functionality
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" && index < categories.length - 1) {
      onCategoryChange(categories[index + 1]);
    } else if (e.key === "ArrowLeft" && index > 0) {
      onCategoryChange(categories[index - 1]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex items-center gap-2 overflow-x-auto py-2 px-1",
          "scrollbar-hide scroll-smooth",
          "touch-pan-x",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="tablist"
        aria-label="Product categories"
      >
        {categories.map((category, index) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              ref={isActive ? activeTabRef : null}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${category}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onCategoryChange(category)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
                "transition-all duration-200 ease-in-out",
                "whitespace-nowrap select-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
              )}
            >
              {category}
            </button>
          );
        })}
        
        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              "border-2 border-dashed border-primary/50 text-primary",
              "hover:border-primary hover:bg-primary/10",
              "transition-all duration-200 ease-in-out",
              "whitespace-nowrap select-none",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            + Add Tab
          </button>
        )}
      </div>
    </div>
  );
}
