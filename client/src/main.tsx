import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import { ThemeProvider } from "./context/ThemeContext.js";
import "./index.css";
import "./i18n.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
