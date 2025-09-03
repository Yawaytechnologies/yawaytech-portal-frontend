// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store/store.js";
import { ensureDemoUsers } from "./redux/services/authService.js";
import App from "./App.jsx";
import "./style.css";

// Seed local demo users so login works now (admin/employee)
ensureDemoUsers();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
