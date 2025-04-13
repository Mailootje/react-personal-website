import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Photography from "@/pages/Photography";
import Apps from "@/pages/Apps";
import PasswordGenerator from "@/pages/apps/PasswordGenerator";
import LinkShortener from "@/pages/apps/LinkShortener";
import QRCodeGenerator from "@/pages/apps/QRCodeGenerator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/photography" component={Photography}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/password-generator" component={PasswordGenerator}/>
      <Route path="/apps/link-shortener" component={LinkShortener}/>
      <Route path="/apps/qr-code-generator" component={QRCodeGenerator}/>
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
