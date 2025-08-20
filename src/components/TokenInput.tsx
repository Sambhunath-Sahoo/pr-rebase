import { useState } from 'react';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key } from 'lucide-react';

export function TokenInput() {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setToken, isLoading } = useAppStore();

  const handleSubmit = async () => {
    const trimmedToken = inputValue.trim();
    
    if (trimmedToken.length === 0) {
      setError('Token cannot be empty');
      return;
    }

    if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
      setError('Please enter a valid GitHub personal access token');
      return;
    }

    try {
      setError(null);
      await setToken(trimmedToken);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save token');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-lg">GitHub Authentication</CardTitle>
        <CardDescription className="text-sm">
          Enter your GitHub Personal Access Token
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-2">
          <Label htmlFor="github-token">Personal Access Token</Label>
          <Input
            id="github-token"
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="ghp_********************"
            disabled={isLoading}
            className="font-mono"
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !inputValue.trim()}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save Token'}
        </Button>

        <div className="rounded-lg bg-muted p-2 text-xs">
          <p className="font-medium mb-1">Need a token?</p>
          <p className="text-muted-foreground mb-2">
            Create one at GitHub Settings with <code className="text-xs">repo</code> permissions
          </p>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Create Token
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}