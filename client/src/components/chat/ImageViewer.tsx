import { useState, useEffect } from "react";
import { X, Shield } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Timer } from "@/components/ui/timer";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  duration?: number;
}

export function ImageViewer({ isOpen, onClose, imageUrl, duration = 20 }: ImageViewerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Prevent screenshots and screen recording (basic detection)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          onClose();
        }
      };
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent common screenshot shortcuts
        if (
          (e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S') ||
          e.key === 'PrintScreen' ||
          e.key === 'F12'
        ) {
          e.preventDefault();
          console.warn('Screenshot attempt detected');
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);
  
  const handleTimerExpire = () => {
    setIsVisible(false);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-full h-full p-0 bg-black border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Timer Display */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/80 backdrop-blur-sm rounded-full px-4 py-2">
              <Timer 
                duration={duration} 
                onExpire={handleTimerExpire}
                className="text-white"
              />
            </div>
          </div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Image Content */}
          {isVisible && (
            <img 
              src={imageUrl} 
              alt="Disappearing image in full view" 
              className="max-w-full max-h-full object-contain"
              style={{
                // Basic screenshot prevention styles
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                pointerEvents: 'none'
              }}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
          
          {/* Security Warning */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="bg-destructive/90 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-destructive-foreground text-sm font-medium">
                <Shield className="w-4 h-4 inline mr-1" />
                Screenshot protection enabled
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
