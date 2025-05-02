import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [token, setToken] = useState("");
  const [isPRPage, setIsPRPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [prInfo, setPrInfo] = useState({
    base: "",
    head: "",
    owner: "",
    repo: "",
    prNumber: "",
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
    console.log("Fetching PR details with:", prInfo); // Log prInfo to check values
    if (!token || !prInfo.repo) {
      console.error("Missing PR information");
      return;
    }

    const { owner, repo, prNumber } = prInfo;
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const prData = await response.json();
      setPrInfo((prev) => ({
        ...prev,
        base: prData.base?.ref || "",
        head: prData.head?.ref || "",
      }));
    } catch (error) {
      console.error("Error fetching PR details:", error);
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
    if (token && isPRPage) {
      getBranches();
    }
  }, [token, isPRPage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <p className="header">GitHub Pull Request Integration</p>

      {isPRPage ? (
        !token ? (
          <div className="token-input">
            <input
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter GitHub Token"
              className="input-field"
            />
            <button onClick={handleSubmit} className="submit-button">
              Submit Token
            </button>
          </div>
        ) : (
          <div className="pr-info">
            <h4 className="pr-title">
              PR: {prInfo.repo}#{prInfo.prNumber}
            </h4>
            <div className="branch-info">
              <p>
                <strong>Base:</strong> {prInfo.base || "Loading..."}
              </p>
              <p>
                <strong>Head:</strong> {prInfo.head || "Loading..."}
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="not-pr-page">
          <p>This is not a GitHub Pull Request page.</p>
          <p>Please navigate to a PR page to use this extension.</p>
        </div>
      )}
    </div>
  );
}

export default App;
