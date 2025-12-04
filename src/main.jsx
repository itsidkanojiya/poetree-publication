import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { PaperProvider } from "./context/PaperContext.jsx";
import { HeaderProvider } from "./context/HeaderContext.jsx";
import { QuestionProvider } from "./context/QuestionContext.jsx";


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  
      <AuthProvider>
        <PaperProvider>
          <QuestionProvider>
            <HeaderProvider>
              <App />
            </HeaderProvider>
          </QuestionProvider>
        </PaperProvider>
      </AuthProvider>

  </BrowserRouter>
);
