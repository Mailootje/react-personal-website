import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DarkModeProvider } from "@/components/DarkModeProvider";
import { VideoBackground } from "@/components/VideoBackground";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Photography from "@/pages/Photography";
import Apps from "@/pages/Apps";
import Downloads from "@/pages/Downloads";
import Games from "@/pages/Games";
import PasswordGenerator from "@/pages/apps/PasswordGenerator";
import LinkShortener from "@/pages/apps/LinkShortener";
import QRCodeGenerator from "@/pages/apps/QRCodeGenerator";
import WeatherDashboard from "@/pages/apps/WeatherDashboard";
import Snake from "@/pages/games/Snake";
import Tetris from "@/pages/games/Tetris";
import PacmanNew from "@/pages/games/PacmanNew";
import PacmanSimple from "@/pages/games/PacmanSimple";
import PacmanBasic from "@/pages/games/PacmanBasic";
import EuroTruckSimulator2 from "@/pages/downloads/EuroTruckSimulator2";
import AmericanTruckSimulator from "@/pages/downloads/AmericanTruckSimulator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/photography" component={Photography}/>
      <Route path="/apps" component={Apps}/>
      <Route path="/apps/password-generator" component={PasswordGenerator}/>
      <Route path="/apps/link-shortener" component={LinkShortener}/>
      <Route path="/apps/qr-code-generator" component={QRCodeGenerator}/>
      <Route path="/apps/weather-dashboard" component={WeatherDashboard}/>
      <Route path="/downloads" component={Downloads}/>
      <Route path="/downloads/euro-truck-simulator-2" component={EuroTruckSimulator2}/>
      <Route path="/downloads/american-truck-simulator" component={AmericanTruckSimulator}/>
      <Route path="/games" component={Games}/>
      <Route path="/games/snake" component={Snake}/>
      <Route path="/games/tetris" component={Tetris}/>
      <Route path="/games/pacman" component={PacmanBasic}/>
      <Route path="/games/pacman-simple" component={PacmanSimple}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </DarkModeProvider>
  );
}

export default App;
