import { create } from 'zustand';
import { createGitHubService } from '../services/github';
import { getCurrentTab, getStoredToken, saveToken, isGitHubPRUrl, parsePRUrl } from '../utils';
import type { PRInfo, ApiError } from '../types';

// Constants
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
const INITIAL_PR_INFO: Partial<PRInfo> = {
  owner: '',
  repo: '',
  prNumber: '',
  base: '',
  head: '',
  behindBy: 0,
  filesInBehindCommits: 0,
  hasConflictsOnRebase: false,
  rebaseSuccess: false,
};

interface AppState {
  // Core state
  token: string;
  isPRPage: boolean;
  prInfo: Partial<PRInfo>;
  isLoading: boolean;
  isLoadingDetails: boolean;
  isRebasing: boolean;
  error: ApiError | null;
  lastFetchTime: number;
  cacheKey: string;

  // Actions
  initialize: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  fetchPRData: (forceRefresh?: boolean) => Promise<void>;
  rebase: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
  reload: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  token: '',
  isPRPage: false,
  prInfo: INITIAL_PR_INFO,
  isLoading: true,
  isLoadingDetails: false,
  isRebasing: false,
  error: null,
  lastFetchTime: 0,
  cacheKey: '',

  // Initialize app - check token and current tab with optimized loading
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Run Chrome API calls in parallel for faster initialization
      const [storedToken, tab] = await Promise.all([
        getStoredToken(),
        getCurrentTab()
      ]);
      
      const url = tab?.url || '';
      const isPRPage = isGitHubPRUrl(url);
      
      let prInfo = {};
      let parsedPR = null;
      if (isPRPage) {
        parsedPR = parsePRUrl(url);
        if (parsedPR) {
          prInfo = parsedPR;
        }
      }

      // Update basic state immediately
      set({ 
        token: storedToken || '', 
        isPRPage, 
        prInfo: { ...get().prInfo, ...prInfo }
      });

      // Show UI immediately, then load PR details in background
      set({ isLoading: false });

      // If we have everything needed, fetch PR data in background
      if (storedToken && isPRPage && parsedPR) {
        // Fetch PR data without blocking UI
        get().fetchPRData();
      }
    } catch (error) {
      set({ 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to initialize app' 
        }, 
        isLoading: false 
      });
    }
  },

  // Set and save token
  setToken: async (newToken: string) => {
    try {
      set({ error: null });
      await saveToken(newToken);
      set({ token: newToken });

      // If on PR page, fetch data
      if (get().isPRPage) {
        get().fetchPRData();
      }
    } catch (error) {
      set({ 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to save token' 
        } 
      });
    }
  },

  // Fetch PR data with optimized parallel calls and caching
  fetchPRData: async (forceRefresh = false) => {
    const { token, prInfo, lastFetchTime, cacheKey } = get();
    
    if (!token || !prInfo.owner || !prInfo.repo || !prInfo.prNumber) {
      return;
    }

    // Create cache key for this PR
    const currentCacheKey = `${prInfo.owner}/${prInfo.repo}/${prInfo.prNumber}`;
    const now = Date.now();

    // Check if we can use cached data (same PR, within cache duration, not forced refresh)
    if (!forceRefresh && 
        cacheKey === currentCacheKey && 
        (now - lastFetchTime) < CACHE_DURATION &&
        prInfo.base && prInfo.head) {
      set({ isLoadingDetails: false });
      return;
    }

    try {
      set({ isLoadingDetails: true, error: null });

      const githubService = createGitHubService(token);

      // Get PR details first (required for base/head refs)
      const prDetails = await githubService.getPullRequest(
        prInfo.owner, 
        prInfo.repo, 
        prInfo.prNumber
      );

      const base = prDetails.base?.ref || '';
      const head = prDetails.head?.ref || '';

      // Update with base/head immediately
      set({ 
        prInfo: { ...get().prInfo, base, head }
      });

      if (base && head) {
        // Make both compare calls in parallel for faster loading
        const [compareData, reverseCompareData] = await Promise.allSettled([
          // Get behind count
          githubService.compareBranches(prInfo.owner, prInfo.repo, base, head),
          // Get files in behind commits (reverse comparison)
          githubService.compareBranches(prInfo.owner, prInfo.repo, head, base)
        ]);

        let behindBy = 0;
        let filesInBehindCommits = 0;

        // Process compare results
        if (compareData.status === 'fulfilled') {
          behindBy = compareData.value.behind_by || 0;
        }

        if (reverseCompareData.status === 'fulfilled' && behindBy > 0) {
          filesInBehindCommits = reverseCompareData.value.files?.length || 0;
        }

        set({ 
          prInfo: { 
            ...get().prInfo, 
            behindBy, 
            filesInBehindCommits,
            hasConflictsOnRebase: false,
            rebaseSuccess: false
          },
          isLoadingDetails: false,
          lastFetchTime: now,
          cacheKey: currentCacheKey
        });
      } else {
        set({ isLoadingDetails: false });
      }
    } catch (error: any) {
      set({ 
        error: { 
          message: error.message || 'Failed to fetch PR data',
          status: error.status,
          code: error.code
        }, 
        isLoadingDetails: false 
      });
    }
  },

  // Rebase PR
  rebase: async () => {
    const { token, prInfo } = get();
    
    if (!token || !prInfo.owner || !prInfo.repo || !prInfo.base || !prInfo.head) {
      set({ 
        error: { message: 'Missing required information for rebase' } 
      });
      return;
    }

    try {
      set({ isRebasing: true, error: null });

      const githubService = createGitHubService(token);
      const commitMessage = `Rebase ${prInfo.head} with ${prInfo.base}`;

      await githubService.mergeBranches(
        prInfo.owner,
        prInfo.repo,
        prInfo.base,  // baseBranch parameter
        prInfo.head,  // featureBranch parameter
        commitMessage
      );

      // Success - update state
      set({ 
        prInfo: { 
          ...get().prInfo, 
          behindBy: 0,
          filesInBehindCommits: 0,
          hasConflictsOnRebase: false,
          rebaseSuccess: true
        },
        isRebasing: false 
      });

    } catch (error: any) {
      const hasConflicts = error.code === 'CONFLICT' || error.status === 409;
      
      set({ 
        prInfo: {
          ...get().prInfo,
          hasConflictsOnRebase: hasConflicts,
          rebaseSuccess: false
        },
        error: hasConflicts ? null : { 
          message: error.message || 'Rebase failed',
          status: error.status,
          code: error.code
        },
        isRebasing: false 
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset all state to initial values
  reset: () => {
    set({
      token: '',
      isPRPage: false,
      prInfo: INITIAL_PR_INFO,
      isLoading: true,
      isLoadingDetails: false,
      isRebasing: false,
      error: null,
      lastFetchTime: 0,
      cacheKey: '',
    });
  },

  // Complete reload - reset and reinitialize with cache clearing
  reload: async () => {
    // Clear all cached data
    set({
      token: '',
      isPRPage: false,
      prInfo: INITIAL_PR_INFO,
      isLoading: true,
      isLoadingDetails: false,
      isRebasing: false,
      error: null,
      lastFetchTime: 0,
      cacheKey: '', // Clear cache key to force fresh data
    });
    
    // Force fresh initialization
    await get().initialize();
  }
}));
