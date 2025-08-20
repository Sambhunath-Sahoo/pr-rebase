import { GITHUB_API, GITHUB_ENDPOINTS, HTTP_STATUS } from '../constants/github';
import { createGitHubHeaders, createGitHubPostHeaders } from '../utils';
import type { GitHubPullRequest, GitHubCompareResponse, GitHubMergeResponse } from '../types';

class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

/**
 * GitHub API service class
 */
export class GitHubService {
  private readonly baseUrl = GITHUB_API.BASE_URL;

  constructor(private readonly token: string) {}

  /**
   * Makes a GET request to the GitHub API
   */
  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: createGitHubHeaders(this.token),
    });

    if (!response.ok) {
      throw new GitHubApiError(
        `GitHub API error: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  /**
   * Makes a POST request to the GitHub API
   */
  private async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: createGitHubPostHeaders(this.token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === HTTP_STATUS.CONFLICT) {
        throw new GitHubApiError('Merge conflict detected', response.status, 'CONFLICT');
      }
      throw new GitHubApiError(
        `GitHub API error: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  /**
   * Gets pull request details
   */
  async getPullRequest(owner: string, repo: string, prNumber: string): Promise<GitHubPullRequest> {
    const endpoint = GITHUB_ENDPOINTS.PULLS(owner, repo, prNumber);
    return this.get<GitHubPullRequest>(endpoint);
  }

  /**
   * Compares two branches
   */
  async compareBranches(
    owner: string,
    repo: string,
    baseBranch: string,
    featureBranch: string
  ): Promise<GitHubCompareResponse> {
    const endpoint = GITHUB_ENDPOINTS.COMPARE(owner, repo, baseBranch, featureBranch);
    return this.get<GitHubCompareResponse>(endpoint);
  }

  /**
   * Merges one branch into another (used for rebasing)
   */
  async mergeBranches(
    owner: string,
    repo: string,
    baseBranch: string,
    featureBranch: string,
    commitMessage: string
  ): Promise<GitHubMergeResponse> {
    const endpoint = GITHUB_ENDPOINTS.MERGES(owner, repo);
    const data = {
      base: featureBranch, // Target branch (PR branch)
      head: baseBranch, // Source branch (base branch)
      commit_message: commitMessage,
    };
    
    return this.post<GitHubMergeResponse>(endpoint, data);
  }
}

/**
 * Creates a new GitHub service instance
 */
export function createGitHubService(token: string): GitHubService {
  return new GitHubService(token);
}
