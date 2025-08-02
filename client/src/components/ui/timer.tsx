import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  duration: number; // in seconds
  onExpire?: () => void;
  className?: string;
  showWarning?: boolean;
}

export function Timer({ duration, onExpire, className, showWarning = true }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = showWarning && timeLeft <= 10;
  
  return (
    <div className={cn(
      "flex items-center space-x-2",
      className
    )}>
      <div className={cn(
        "w-4 h-4 rounded-full transition-colors",
        isWarning ? "bg-destructive animate-pulse" : "bg-warning"
      )} />
      <span className="font-mono text-sm">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">remaining</span>
    </div>
  );
}
