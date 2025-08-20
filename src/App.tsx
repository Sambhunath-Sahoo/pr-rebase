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
  const { token, isPRPage, isLoading, isLoadingDetails, error, clearError, reload, fetchPRData } = useAppStore();

  useEffect(() => {
    // Initialize extension when component mounts
    reload();
  }, [reload]);

  if (isLoading) {
    return (
      <div className="w-96 min-h-[200px] max-h-[600px] bg-background text-foreground flex items-center justify-center dark">
        <div className="flex flex-col items-center space-y-3 p-8">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 min-h-[200px] max-h-[600px] bg-background text-foreground overflow-y-auto dark">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">PR Rebase Assistant</h1>
              <p className="text-xs text-muted-foreground leading-tight">Automate rebasing in one click</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isPRPage && token) {
                fetchPRData(true); // Force refresh with cache bypass
              } else {
                reload(); // Complete reload
              }
            }}
            disabled={isLoading || isLoadingDetails}
            className="h-7 w-7 p-0 flex-shrink-0 cursor-pointer hover:cursor-pointer disabled:cursor-not-allowed"
            title="Refresh Extension"
          >
            {isLoading || isLoadingDetails ? (
              <Spinner size="sm" className="h-3.5 w-3.5" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-4">
          {(() => {
            if (!isPRPage) {
              return <NotPRPage />;
            }
            
            if (!token) {
              return <TokenInput />;
            }
            
            return (
              <div className="space-y-3">
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