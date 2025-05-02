import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [token, setToken] = useState("");

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
    chrome.storage.local.get("githubToken", (result) => {
      const token = result.githubToken;
      if (!token) {
        console.error("No token found");
        return;
      }
      setToken(token);
      console.log("Token retrieved:", token);
    });
  }

  useEffect(() => {
    getToken();
  }, []);

  return (
    <>
      <h1>GitHub Pull Request Integration</h1>
      {!token && (
        <div>
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter GitHub Token"
          />
          <button onClick={handleSubmit}>Submit Token</button>
        </div>
      )}
      {token && (
        <div>
         <h3>Here is your Auth Token: {token}</h3>
        </div>
      )}
    </>
  );
}

export default App;
