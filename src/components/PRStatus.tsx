import { useAppStore } from '@/store/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { GitBranch, GitCommit, FileText, CheckCircle } from 'lucide-react';

export function PRStatus() {
  const { prInfo, isLoading, isLoadingDetails } = useAppStore();

  // Show loading if either initial load or details are loading
  if (isLoading || isLoadingDetails) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <Spinner size="lg" className="text-blue-600" />
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Initializing...' : 'Checking PR status...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCommit className="h-4 w-4" />
          Pull Request Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Repository Info */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Repository</p>
          <p className="text-base font-semibold">
            {prInfo.owner}/{prInfo.repo}#{prInfo.prNumber}
          </p>
        </div>

        <Separator />

        {/* Branch Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Base</span>
            </div>
            <Badge variant="secondary" className="font-mono text-xs h-5">
              {prInfo.base || 'Loading...'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Head</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs h-5">
              {prInfo.head || 'Loading...'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Status Info */}
        <div>
          {prInfo.behindBy !== undefined ? (
            prInfo.behindBy === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-800 dark:text-green-200">
                  PR is up-to-date with base branch
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                <Badge variant="destructive" className="flex items-center gap-1 text-xs h-5">
                  <GitCommit className="h-3 w-3" />
                  Behind by {prInfo.behindBy} commits
                </Badge>
                {prInfo.filesInBehindCommits !== undefined && prInfo.filesInBehindCommits > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5">
                    <FileText className="h-3 w-3" />
                    {prInfo.filesInBehindCommits} files affected
                  </Badge>
                )}
              </div>
            )
          ) : (
            // Show loading state for status when data is not yet available
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
              <Spinner size="sm" className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Checking commit status...
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}