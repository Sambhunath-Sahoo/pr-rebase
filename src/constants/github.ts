export const GITHUB_API = {
  BASE_URL: 'https://api.github.com',
  VERSION: '2022-11-28',
  HEADERS: {
    ACCEPT: 'application/vnd.github+json',
    CONTENT_TYPE: 'application/json',
  },
} as const;

export const GITHUB_ENDPOINTS = {
  PULLS: (owner: string, repo: string, prNumber: string) => 
    `/repos/${owner}/${repo}/pulls/${prNumber}`,
  COMPARE: (owner: string, repo: string, base: string, head: string) => 
    `/repos/${owner}/${repo}/compare/${base}...${head}`,
  MERGES: (owner: string, repo: string) => 
    `/repos/${owner}/${repo}/merges`,
} as const;

export const PR_URL_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

export const CHROME_STORAGE_KEYS = {
  GITHUB_TOKEN: 'githubToken',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
} as const;
