# PR Rebase Assistant

A Chrome extension that helps you rebase GitHub Pull Requests with one click, showing detailed status information about commits behind and files affected.

## Features

- 🔍 **Auto-detect GitHub PR pages** - Works automatically when you visit a GitHub Pull Request
- 📊 **Detailed Status** - Shows commits behind and files affected by the rebase
- 🔄 **One-click Rebase** - Automatically rebase your PR branch with the base branch
- ⚠️ **Conflict Detection** - Alerts you when manual conflict resolution is needed
- 🔐 **Secure Token Storage** - Safely stores your GitHub token in Chrome's local storage
- 🎨 **Modern UI** - Clean, GitHub-inspired dark theme interface

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pr-rebase
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Build the extension**
   ```bash
   npm run build
   # or
   yarn build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Usage

1. **Setup GitHub Token**
   - Visit [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
   - Create a new token with `repo` permissions
   - Copy the token

2. **Use the Extension**
   - Navigate to any GitHub Pull Request page
   - Click the extension icon in your Chrome toolbar
   - Enter your GitHub token when prompted
   - View PR status and rebase if needed

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── TokenInput.tsx   # GitHub token input form
│   ├── PRStatus.tsx     # PR status display
│   ├── RebaseButton.tsx # Rebase action button
│   ├── LoadingSpinner.tsx
│   ├── ErrorMessage.tsx
│   ├── NotPRPage.tsx
│   └── index.ts         # Barrel exports
├── hooks/               # Custom React hooks
│   ├── useGitHubToken.ts # Token management
│   ├── useCurrentTab.ts  # Tab detection
│   ├── usePRData.ts     # PR data fetching
│   ├── useRebase.ts     # Rebase operations
│   └── index.ts
├── services/            # API services
│   └── github.ts        # GitHub API client
├── types/               # TypeScript type definitions
│   ├── github.ts        # GitHub API types
│   └── app.ts           # Application types
├── utils/               # Utility functions
│   ├── github.ts        # GitHub-related utilities
│   └── chrome.ts        # Chrome extension utilities
├── constants/           # Application constants
│   └── github.ts        # GitHub API constants
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
├── index.css            # Global styles
└── vite-env.d.ts        # Vite type definitions
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Chrome Extensions API** - Browser integration
- **GitHub REST API** - GitHub integration

## API Endpoints Used

- `GET /repos/{owner}/{repo}/pulls/{number}` - Get PR details
- `GET /repos/{owner}/{repo}/compare/{base}...{head}` - Compare branches
- `POST /repos/{owner}/{repo}/merges` - Merge branches (for rebasing)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Development Workflow

1. Run `npm run dev` for hot reloading during development
2. Test changes by reloading the extension in Chrome
3. Build with `npm run build` before publishing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security

- GitHub tokens are stored locally in Chrome's secure storage
- No tokens are transmitted to external servers
- All API calls go directly to GitHub's official API

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **"Not a Pull Request page"**
   - Make sure you're on a GitHub PR page with URL format: `https://github.com/owner/repo/pull/123`

2. **"API rate limit exceeded"**
   - GitHub API has rate limits. Wait a few minutes and try again

3. **"Cannot rebase automatically"**
   - There are merge conflicts that need manual resolution
   - Resolve conflicts in your local repository and push

4. **Extension not loading**
   - Make sure you've built the project (`npm run build`)
   - Load the `dist` folder, not the source folder
   - Check Chrome's extension error console for details