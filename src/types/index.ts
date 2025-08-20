// App-specific types
export interface PRInfo {
  base: string;
  head: string;
  owner: string;
  repo: string;
  prNumber: string;
  behindBy: number;
  filesInBehindCommits: number;
  hasConflictsOnRebase: boolean;
  rebaseSuccess: boolean;
}

export interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  active?: boolean;
}

export interface ChromeStorageResult {
  githubToken?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// GitHub API types (essential ones only)
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
  site_admin: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: GitHubUser | null;
}

export interface GitHubFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
}

export interface GitHubCompareResponse {
  status: 'identical' | 'ahead' | 'behind' | 'diverged';
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: GitHubCommit[];
  files: GitHubFile[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  state: 'open' | 'closed';
  title: string;
  base: {
    ref: string;
    sha: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  html_url: string;
}

export interface GitHubMergeResponse {
  sha: string;
  merged: boolean;
  message: string;
}
