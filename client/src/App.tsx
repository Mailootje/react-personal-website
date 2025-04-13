import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Photography from "@/pages/Photography";
import Apps from "@/pages/Apps";
import Downloads from "@/pages/Downloads";
import PasswordGenerator from "@/pages/apps/PasswordGenerator";
import LinkShortener from "@/pages/apps/LinkShortener";
import QRCodeGenerator from "@/pages/apps/QRCodeGenerator";
import EuroTruckSimulator2 from "@/pages/downloads/EuroTruckSimulator2";
import AnimatedExperience from "@/pages/AnimatedExperience";
import AnimationGuide from "@/pages/AnimationGuide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/photography" component={Photography}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/password-generator" component={PasswordGenerator}/>
      <Route path="/apps/link-shortener" component={LinkShortener}/>
      <Route path="/apps/qr-code-generator" component={QRCodeGenerator}/>
      <Route path="/downloads" component={Downloads}/>
      <Route path="/downloads/euro-truck-simulator-2" component={EuroTruckSimulator2}/>
      <Route path="/experience" component={AnimatedExperience}/>
      <Route path="/animation-guide" component={AnimationGuide}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
