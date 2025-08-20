import { create } from 'zustand';
import { createGitHubService } from '../services/github';
import { getCurrentTab, getStoredToken, saveToken, isGitHubPRUrl, parsePRUrl } from '../utils';
import type { PRInfo, ApiError } from '../types';

interface AppState {
  // Core state
  token: string;
  isPRPage: boolean;
  prInfo: Partial<PRInfo>;
  isLoading: boolean;
  isRebasing: boolean;
  error: ApiError | null;

  // Actions
  initialize: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  fetchPRData: () => Promise<void>;
  rebase: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  token: '',
  isPRPage: false,
  prInfo: {
    owner: '',
    repo: '',
    prNumber: '',
    base: '',
    head: '',
    behindBy: 0,
    filesInBehindCommits: 0,
    hasConflictsOnRebase: false,
    rebaseSuccess: false,
  },
  isLoading: true,
  isRebasing: false,
  error: null,

  // Initialize app - check token and current tab
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get stored token
      const storedToken = await getStoredToken();
      
      // Check current tab
      const tab = await getCurrentTab();
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

      set({ 
        token: storedToken || '', 
        isPRPage, 
        prInfo: { ...get().prInfo, ...prInfo },
        isLoading: false 
      });


      if (storedToken && isPRPage && parsedPR) {
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

  // Fetch PR data
  fetchPRData: async () => {
    const { token, prInfo } = get();
    
    if (!token || !prInfo.owner || !prInfo.repo || !prInfo.prNumber) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const githubService = createGitHubService(token);

      // Get PR details
      const prDetails = await githubService.getPullRequest(
        prInfo.owner, 
        prInfo.repo, 
        prInfo.prNumber
      );

      const base = prDetails.base?.ref || '';
      const head = prDetails.head?.ref || '';

      set({ 
        prInfo: { ...get().prInfo, base, head }
      });

      if (base && head) {
        // Compare branches to get behind count
        const compareData = await githubService.compareBranches(
          prInfo.owner, 
          prInfo.repo, 
          base, 
          head
        );
        
        const behindBy = compareData.behind_by || 0;
        let filesInBehindCommits = 0;

        // If behind, get files involved in the behind commits
        if (behindBy > 0) {
          try {
            // Compare head...base to get files in commits we're behind
            const reverseCompareData = await githubService.compareBranches(
              prInfo.owner, 
              prInfo.repo, 
              head, // baseBranch parameter
              base  // featureBranch parameter
            );
            filesInBehindCommits = reverseCompareData.files?.length || 0;
          } catch (error) {
            console.error('Error fetching reverse compare data:', error);
          }
        }

        set({ 
          prInfo: { 
            ...get().prInfo, 
            behindBy, 
            filesInBehindCommits,
            hasConflictsOnRebase: false,
            rebaseSuccess: false
          },
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({ 
        error: { 
          message: error.message || 'Failed to fetch PR data',
          status: error.status,
          code: error.code
        }, 
        isLoading: false 
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
      prInfo: {
        owner: '',
        repo: '',
        prNumber: '',
        base: '',
        head: '',
        behindBy: 0,
        filesInBehindCommits: 0,
        hasConflictsOnRebase: false,
        rebaseSuccess: false,
      },
      isLoading: true,
      isRebasing: false,
      error: null,
    });
  }
}));
