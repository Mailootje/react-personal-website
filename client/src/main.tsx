import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("main.tsx: Starting to render application");
const rootElement = document.getElementById("root");
console.log("main.tsx: Root element found:", rootElement);

if (rootElement) {
  try {
    console.log("main.tsx: Creating root");
    const root = createRoot(rootElement);
    console.log("main.tsx: Rendering App");
    root.render(<App />);
    console.log("main.tsx: App rendered successfully");
  } catch (error) {
    console.error("main.tsx: Error rendering App:", error);
  }
} else {
  console.error("main.tsx: Root element not found");
}
