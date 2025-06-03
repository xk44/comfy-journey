import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./midjourney-theme.css"; // Import the Midjourney-style theme
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";

// Apply saved theme preference before rendering
try {
  const prefs = JSON.parse(localStorage.getItem("comfyui_preferences") || "{}");
  if (prefs.darkMode === false) {
    document.body.classList.add("light-theme");
  }
} catch (err) {
  console.error("Failed to load theme preference", err);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
