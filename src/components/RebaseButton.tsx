import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { GitMerge, CheckCircle, AlertTriangle, X } from 'lucide-react';

export function RebaseButton() {
  const { prInfo, isRebasing, isLoadingDetails, rebase, error } = useAppStore();

  // Don't show rebase button if still loading details or if up to date
  if (isLoadingDetails || prInfo.behindBy === 0) {
    return null;
  }

  // Don't show if we don't have behind count yet
  if (prInfo.behindBy === undefined) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <Button
          onClick={rebase}
          disabled={isRebasing}
          className="w-full"
          variant={isRebasing ? "secondary" : "default"}
        >
          {isRebasing ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Rebasing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" />
              <span>Rebase PR ({prInfo.behindBy} commits)</span>
            </div>
          )}
        </Button>

        {/* Result Messages */}
        <div className="space-y-2">
          {prInfo.rebaseSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 py-2">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
                Rebase successful! Your PR is now up-to-date.
              </AlertDescription>
            </Alert>
          )}

          {prInfo.hasConflictsOnRebase && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <p className="font-medium">Cannot rebase automatically due to conflicts.</p>
                  <p className="opacity-90">
                    Please resolve conflicts manually in your local repository.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && !prInfo.hasConflictsOnRebase && (
            <Alert variant="destructive" className="py-2">
              <X className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  <p className="font-medium">{error.message}</p>
                  {error.status && (
                    <p className="opacity-90">
                      Error {error.status}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}