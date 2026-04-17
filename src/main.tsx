import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { i18nReady } from "./i18n"; // initialise i18next before first render

// Wait for i18next to finish loading translations before mounting React.
// This prevents a flash where keys like "nav.dashboard" briefly appear as raw strings.
i18nReady.then(() => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <App />
    </ThemeProvider>
  );
});
