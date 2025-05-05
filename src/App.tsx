import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [token, setToken] = useState("");
  const [isPRPage, setIsPRPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebasing, setIsRebasing] = useState(false);
  const [hasFetchedCompareData, setHasFetchedCompareData] = useState(false);

  const [prInfo, setPrInfo] = useState({
    base: "",
    head: "",
    owner: "",
    repo: "",
    prNumber: "",
    behindBy: 0,
    hasConflictsOnRebase: false,
    rebaseSuccess: false,
  });

  const handleSubmit = () => {
    const parsedToken = inputValue.trim();
    if (parsedToken.length === 0) {
      console.error("Token cannot be empty");
      return;
    }

    chrome.storage.local.set({ githubToken: parsedToken }, () => {
      setToken(parsedToken);
      console.log("Token saved.");
    });
  };

  const getToken = () => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get("githubToken", (result) => {
        const token = result.githubToken;
        if (token) {
          setToken(token);
          console.log("Token retrieved:", token);
        }
        resolve();
      });
    });
  };

  const setPrInformation = (url: string) => {
    const prUrlPattern =
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
    const match = prUrlPattern.exec(url);

    if (!match) {
      console.error("Invalid PR URL");
      return false;
    }
    const [, owner, repo, prNumber] = match;
    setPrInfo((prev) => ({
      ...prev,
      owner,
      repo,
      prNumber,
    }));
    return true;
  };

  const getBranches = async () => {
    if (!token || !prInfo.repo) return;

    const { owner, repo, prNumber } = prInfo;
    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
      const prResponse = await fetch(prUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!prResponse.ok) throw new Error(`HTTP ${prResponse.status}`);

      const prData = await prResponse.json();

      const base = prData.base?.ref || "";
      const head = prData.head?.ref || "";

      setPrInfo((prev) => ({
        ...prev,
        base,
        head,
      }));

      if (base && head) {
        const compareUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`;
        const compareRes = await fetch(compareUrl, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        const compareData = await compareRes.json();
        console.log("TCL: getBranches -> compareData", compareData);

        setPrInfo((prev) => ({
          ...prev,
          behindBy: compareData.behind_by || 0,
        }));
        setHasFetchedCompareData(true);
      }
    } catch (error) {
      console.error("Error fetching PR details:", error);
      setHasFetchedCompareData(true);
    }
  };

  const handleRebase = async () => {
    setIsRebasing(true);
    setPrInfo((prev) => ({
      ...prev,
      hasConflictsOnRebase: false,
      rebaseSuccess: false,
    }));

    const { owner, repo, base, head } = prInfo;
    const mergeUrl = `https://api.github.com/repos/${owner}/${repo}/merges`;

    try {
      const response = await fetch(mergeUrl, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: head,
          head: base,
          commit_message: `Rebase ${head} with ${base}`,
        }),
      });

      if (response.status === 409) {
        setPrInfo((prev) => ({
          ...prev,
          hasConflictsOnRebase: true,
        }));
        return;
      }

      const data = await response.json();
      if (data.sha) {
        setPrInfo((prev) => ({
          ...prev,
          behindBy: 0,
          hasConflictsOnRebase: false,
          rebaseSuccess: true,
        }));
      }
    } catch (err) {
      console.error("Merge failed:", err);
    } finally {
      setIsRebasing(false);
    }
  };

  const checkIfPRPage = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0]?.url;
    const prUrlPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

    if (url && prUrlPattern.test(url)) {
      setIsPRPage(true);
      return setPrInformation(url);
    }
    return false;
  };

  useEffect(() => {
    const initialize = async () => {
      await getToken();
      const isPR = await checkIfPRPage();
      if (isPR && token) {
        await getBranches();
      }
      setIsLoading(false);
    };
    initialize();
  }, [token]);

  useEffect(() => {
    const initialize = async () => {
      if (token && isPRPage) {
        await getBranches();
      }
    };
    initialize();
  }, [token, isPRPage]);

  return (
    <div
      id="root"
      className="min-h-screen min-w-80 bg-[#0d1117] text-white flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-[#161b22] rounded-2xl shadow-xl border border-[#30363d] p-6 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <img
            src="assets/github.png"
            alt="GitHub"
            className="w-12 h-12 rounded-full"
          />
          <h1 className="text-xl font-semibold text-white">
            PR Rebase Assistant
          </h1>
          <p className="text-sm text-gray-400">
            Automate rebasing in one click
          </p>
        </div>

        {isLoading ? (
          <p className="text-gray-400 text-center">⏳ Loading...</p>
        ) : isPRPage ? (
          !token ? (
            <div>
              <label className="block text-sm mb-1 text-gray-300">
                Enter GitHub Token
              </label>
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ghp_********************"
                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-md focus:outline-none focus:ring focus:ring-blue-600"
              />
              <button
                onClick={handleSubmit}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition cursor-pointer"
              >
                Submit Token
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Repository</p>
                <h2 className="text-lg font-semibold">
                  {prInfo.repo}#{prInfo.prNumber}
                </h2>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-400">Base Branch: </span>
                  <span className="font-mono">{prInfo.base}</span>
                </p>
                <p>
                  <span className="text-gray-400">Head Branch: </span>
                  <span className="font-mono">{prInfo.head}</span>
                </p>
              </div>

              {!hasFetchedCompareData ? (
                <p className="text-gray-400 text-sm">
                  🔍 Checking PR status...
                </p>
              ) : prInfo.behindBy !== 0 ? (
                <div className="space-y-3">
                  <span className="inline-block bg-yellow-500 text-black px-2 py-1 rounded text-xs">
                    🔻 Behind by {prInfo.behindBy} commits
                  </span>
                  <button
                    onClick={handleRebase}
                    disabled={isRebasing}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md transition ${
                      isRebasing
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {isRebasing ? "Rebasing..." : "Rebase PR"}
                  </button>
                  <div className="min-h-[2.5rem] text-sm">
                    {prInfo.hasConflictsOnRebase && (
                      <p className="text-red-400">
                        ⚠️ Cannot rebase automatically. Please resolve conflicts
                        manually.
                      </p>
                    )}
                  </div>

                  {prInfo.rebaseSuccess && (
                    <p className="text-green-400 text-sm">
                      ✅ Rebase successful!
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-green-400 text-sm">
                  ✅ PR is up-to-date with base branch
                </p>
              )}
            </div>
          )
        ) : (
          <p className="text-gray-400 text-sm text-center">
            🚫 This is not a Pull Request page. Please open a PR.
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
