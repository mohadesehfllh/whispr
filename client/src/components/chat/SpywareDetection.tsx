import { useState, useEffect } from "react";
import { AlertTriangle, Shield, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SpywareDetectionProps {
  onDetectionComplete: (isSecure: boolean | null) => void;
  isActive: boolean;
}

interface SecurityThreat {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export function SpywareDetection({ onDetectionComplete, isActive }: SpywareDetectionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isActive) {
      performSecurityScan();
    }
  }, [isActive]);

  const performSecurityScan = async () => {
    setIsScanning(true);
    setThreats([]);
    
    const detectedThreats: SecurityThreat[] = [];

    // Check for developer tools
    if (isDevToolsOpen()) {
      detectedThreats.push({
        type: 'Developer Tools',
        description: 'Browser developer tools are open',
        severity: 'high'
      });
    }

    // Check for suspicious browser extensions
    const suspiciousExtensions = await checkForSuspiciousExtensions();
    if (suspiciousExtensions.length > 0) {
      detectedThreats.push({
        type: 'Browser Extensions',
        description: `${suspiciousExtensions.length} potentially suspicious extensions detected`,
        severity: 'medium'
      });
    }

    // Check for screen recording APIs
    if (await isScreenRecordingActive()) {
      detectedThreats.push({
        type: 'Screen Recording',
        description: 'Screen recording may be active',
        severity: 'high'
      });
    }

    // Check for unusual window behavior
    if (checkWindowTampering()) {
      detectedThreats.push({
        type: 'Window Tampering',
        description: 'Unusual window behavior detected',
        severity: 'medium'
      });
    }

    // Simulate scan time
    await new Promise(resolve => setTimeout(resolve, 2000));

    setThreats(detectedThreats);
    setIsScanning(false);
    setShowResults(true);

    // Auto-close if no threats found
    if (detectedThreats.length === 0) {
      setTimeout(() => {
        onDetectionComplete(true);
        setShowResults(false);
      }, 1500);
    }
  };

  const isDevToolsOpen = (): boolean => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    // Check for console redirection
    let consoleModified = false;
    try {
      const originalLog = console.log;
      console.log = function() {};
      console.log = originalLog;
    } catch (e) {
      consoleModified = true;
    }

    return widthThreshold || heightThreshold || consoleModified;
  };

  const checkForSuspiciousExtensions = async (): Promise<string[]> => {
    // This is a basic check - in real implementation, you'd check for known suspicious extensions
    const suspiciousExtensions: string[] = [];
    
    // Check for common screen recording extension patterns
    if (document.querySelector('[data-extension-id]')) {
      suspiciousExtensions.push('Screen Recording Extension');
    }

    // Check for injected scripts that might indicate extensions
    const scripts = Array.from(document.scripts);
    const suspiciousScripts = scripts.filter(script => 
      script.src.includes('extension') || 
      script.src.includes('chrome-extension') ||
      script.src.includes('moz-extension')
    );

    if (suspiciousScripts.length > 0) {
      suspiciousExtensions.push('Injected Extension Scripts');
    }

    return suspiciousExtensions;
  };

  const isScreenRecordingActive = async (): Promise<boolean> => {
    try {
      // Try to access screen capture API to see if it's already in use
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true
      });
      stream.getTracks().forEach(track => track.stop());
      return false; // If we can get it, nothing else is using it
    } catch (error) {
      // If we can't get it, something might be using it
      return true;
    }
  };

  const checkWindowTampering = (): boolean => {
    // Check if window object has been modified
    const originalFunctions = [
      'alert', 'confirm', 'prompt', 'open', 'close', 'focus', 'blur'
    ];
    
    return originalFunctions.some(func => {
      try {
        const windowFunc = (window as any)[func];
        return windowFunc && windowFunc.toString().indexOf('[native code]') === -1;
      } catch (e) {
        return true;
      }
    });
  };

  const handleContinueAnyway = () => {
    onDetectionComplete(false); // Pass false to indicate security issues but user chose to continue
    setShowResults(false);
  };

  const handleCancel = () => {
    onDetectionComplete(null); // Pass null to indicate user cancelled
    setShowResults(false);
  };

  if (!isActive && !showResults) return null;

  return (
    <Dialog open={isScanning || showResults} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Security Scan</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isScanning ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="font-medium mb-2">Scanning for security threats...</h3>
              <p className="text-sm text-muted-foreground">
                Checking for screen recording software, browser extensions, and other potential threats
              </p>
            </div>
          ) : threats.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-medium text-success mb-2">Environment Secure</h3>
              <p className="text-sm text-muted-foreground">
                No security threats detected. Proceeding with secure call...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-medium text-destructive mb-2">Security Threats Detected</h3>
                <p className="text-sm text-muted-foreground">
                  We found potential security issues that could compromise your privacy
                </p>
              </div>

              <div className="space-y-2">
                {threats.map((threat, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{threat.type}:</strong> {threat.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Close developer tools and browser extensions</li>
                  <li>• Disable screen recording software</li>
                  <li>• Use a private browsing window</li>
                  <li>• Restart your browser for best security</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel Call
                </Button>
                <Button variant="secondary" onClick={handleContinueAnyway} className="flex-1">
                  Call Anyway
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}