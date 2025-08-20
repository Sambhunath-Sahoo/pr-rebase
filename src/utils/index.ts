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

export function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CHROME_STORAGE_KEYS.GITHUB_TOKEN, (result: ChromeStorageResult) => {
      resolve(result.githubToken || null);
    });
  });
}

export function saveToken(token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [CHROME_STORAGE_KEYS.GITHUB_TOKEN]: token }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}
