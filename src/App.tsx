import { useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { TokenInput } from '@/components/TokenInput';
import { PRStatus } from '@/components/PRStatus';
import { RebaseButton } from '@/components/RebaseButton';
import { NotPRPage } from '@/components/NotPRPage';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { GitBranch, X, RotateCcw } from 'lucide-react';
import './App.css';

function App() {
  const { initialize, token, isPRPage, isLoading, error, clearError, reset } = useAppStore();

  useEffect(() => {
    // Force complete reload when extension opens
    const handleExtensionOpen = () => {
      reset(); // Clear all state
      initialize(); // Reinitialize
    };

    // Listen for visibility change to detect extension reopening
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleExtensionOpen();
      }
    };

    // Listen for focus events to detect extension reopening
    const handleFocus = () => {
      handleExtensionOpen();
    };

    // Initial load
    handleExtensionOpen();

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialize, reset]);

  if (isLoading) {
    return (
      <div className="w-96 h-[600px] bg-background text-foreground flex items-center justify-center dark">
        <div className="flex flex-col items-center space-y-3">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-[600px] bg-background text-foreground overflow-hidden dark">
      <div className="h-full flex flex-col p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">PR Rebase Assistant</h1>
              <p className="text-xs text-muted-foreground">Automate rebasing in one click</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reset();
              initialize();
            }}
            className="h-8 w-8 p-0"
            title="Refresh Extension"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            if (!isPRPage) {
              return <NotPRPage />;
            }
            
            if (!token) {
              return <TokenInput />;
            }
            
            return (
              <div className="space-y-4">
                <PRStatus />
                
                {/* Global Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">Error</p>
                          <p>{error.message}</p>
                          {error.status && (
                            <p className="text-sm opacity-90">
                              Status: {error.status}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearError}
                          className="ml-2 h-auto p-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <RebaseButton />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default App;