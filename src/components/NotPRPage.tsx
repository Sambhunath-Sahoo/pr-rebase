import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GitPullRequest, Info } from 'lucide-react';

export function NotPRPage() {
  return (
    <Card>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
          <GitPullRequest className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <CardTitle className="text-base">Not a Pull Request Page</CardTitle>
        <CardDescription className="text-xs">
          Please navigate to a GitHub Pull Request page to use this extension.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Alert className="py-2">
          <Info className="h-3 w-3" />
          <AlertDescription className="text-xs">
            <div className="space-y-2">
              <p className="font-medium">Expected URL format:</p>
              <code className="block rounded bg-muted px-2 py-1 text-xs break-all font-mono">
                https://github.com/owner/repo/pull/123
              </code>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
