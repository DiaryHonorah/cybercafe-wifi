import React from "react";
import ReactDOM from "react-dom/client";
import { LanguageProvider } from "./context/LanguageContext";
import { PublicLangProvider } from "./context/PublicLangContext";
import { NotificationProvider } from "./context/NotificationContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <PublicLangProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </PublicLangProvider>
  </LanguageProvider>
);