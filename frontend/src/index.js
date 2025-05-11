import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./midjourney-theme.css"; // Import the Midjourney-style theme
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
