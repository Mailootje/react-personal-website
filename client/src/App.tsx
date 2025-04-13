import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Apps from "@/pages/Apps";
import VideoChat from "@/pages/apps/VideoChat";

// Basic router implementation
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/video-chat" component={VideoChat}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="app-container">
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    </DarkModeProvider>
  );
}

export default App;
