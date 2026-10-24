import React from "react";
import ReactDOM from "react-dom/client";
import { LanguageProvider } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CaisseProvider } from "./context/CaisseContext";
import { PublicLangProvider } from "./context/PublicLangContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LanguageProvider>
    <PublicLangProvider>
      <NotificationProvider>
        <WebSocketProvider>
          <CaisseProvider>
            <App />
          </CaisseProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </PublicLangProvider>
  </LanguageProvider>
);