import { CHROME_STORAGE_KEYS, PR_URL_PATTERN } from '../constants/github';
import type { PRInfo, ChromeTab, ChromeStorageResult } from '../types';

// GitHub utilities
export function parsePRUrl(url: string): Pick<PRInfo, 'owner' | 'repo' | 'prNumber'> | null {
  const match = PR_URL_PATTERN.exec(url);
  
  if (!match) {
    return null;
  }
  
  const [, owner, repo, prNumber] = match;
  return { owner, repo, prNumber };
}

export function isGitHubPRUrl(url: string): boolean {
  return PR_URL_PATTERN.test(url);
}

export function createGitHubHeaders(token: string): HeadersInit {
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Cache-Control': 'no-cache',
  };
}

export function createGitHubPostHeaders(token: string): HeadersInit {
  return {
    ...createGitHubHeaders(token),
    'Content-Type': 'application/json',
  };
}

// Chrome extension utilities
export async function getCurrentTab(): Promise<ChromeTab | null> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(CHROME_STORAGE_KEYS.GITHUB_TOKEN) as ChromeStorageResult;
    return result.githubToken || null;
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [CHROME_STORAGE_KEYS.GITHUB_TOKEN]: token });
  } catch (error) {
    throw new Error(`Failed to save token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
