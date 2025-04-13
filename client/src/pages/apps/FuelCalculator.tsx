import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calculator, 
  Fuel, 
  Navigation, 
  DollarSign, 
  FileBarChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoBackground } from "@/components/VideoBackground";

// Type definitions
type CalculationMode = "european" | "american";
type FuelUnit = "litersPerKm" | "kmPerLiter" | "mpg";

interface FuelCalculationResult {
  totalFuelUsed: number;
  totalCost: number;
  fuelEfficiency: string;
  costPerDistance: string;
}

export default function FuelCalculator() {
  const { toast } = useToast();
  const [calculationMode, setCalculationMode] = useState<CalculationMode>("european");
  const [fuelUnit, setFuelUnit] = useState<FuelUnit>("kmPerLiter");
  const [fuelEfficiency, setFuelEfficiency] = useState<string>("15");
  const [distance, setDistance] = useState<string>("100");
  const [fuelPrice, setFuelPrice] = useState<string>("2.0");
  const [calculationResult, setCalculationResult] = useState<FuelCalculationResult | null>(null);

  // Update fuel unit when calculation mode changes
  useEffect(() => {
    if (calculationMode === "european") {
      setFuelUnit("kmPerLiter");
      setFuelEfficiency("15"); // Default: 15 km/L
      setFuelPrice("2.0");     // Default: 2.0 EUR/L
    } else {
      setFuelUnit("mpg");
      setFuelEfficiency("25"); // Default: 25 MPG
      setFuelPrice("4.0");     // Default: $4.0 per gallon
    }
  }, [calculationMode]);

  // Calculate results
  const calculateFuelCost = () => {
    try {
      const distanceValue = parseFloat(distance);
      const efficiencyValue = parseFloat(fuelEfficiency);
      const priceValue = parseFloat(fuelPrice);
      
      if (isNaN(distanceValue) || isNaN(efficiencyValue) || isNaN(priceValue)) {
        throw new Error("Please enter valid numbers");
      }
      
      if (distanceValue <= 0 || efficiencyValue <= 0 || priceValue <= 0) {
        throw new Error("Values must be greater than zero");
      }
      
      let totalFuelUsed = 0;
      let totalCost = 0;
      let fuelEfficiencyText = "";
      let costPerDistanceText = "";
      
      if (calculationMode === "european") {
        // European calculations (metric)
        if (fuelUnit === "kmPerLiter") {
          // Efficiency in km/L
          totalFuelUsed = distanceValue / efficiencyValue; // L
          totalCost = totalFuelUsed * priceValue; // EUR
          fuelEfficiencyText = `${efficiencyValue.toFixed(1)} km/L`;
          costPerDistanceText = `${(totalCost / distanceValue).toFixed(2)} €/km`;
        } else {
          // Efficiency in L/100km
          totalFuelUsed = (distanceValue * efficiencyValue) / 100; // L
          totalCost = totalFuelUsed * priceValue; // EUR
          fuelEfficiencyText = `${efficiencyValue.toFixed(1)} L/100km`;
          costPerDistanceText = `${(totalCost / distanceValue).toFixed(2)} €/km`;
        }
      } else {
        // American calculations (imperial)
        // Efficiency in MPG (miles per gallon)
        totalFuelUsed = distanceValue / efficiencyValue; // gallons
        totalCost = totalFuelUsed * priceValue; // USD
        fuelEfficiencyText = `${efficiencyValue.toFixed(1)} mpg`;
        costPerDistanceText = `$${(totalCost / distanceValue).toFixed(2)}/mile`;
      }
      
      setCalculationResult({
        totalFuelUsed,
        totalCost,
        fuelEfficiency: fuelEfficiencyText,
        costPerDistance: costPerDistanceText
      });
      
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Calculation Error",
        description: error instanceof Error ? error.message : "An error occurred during calculation",
        variant: "destructive",
      });
    }
  };

  // Format label text based on calculation mode
  const formatDistanceUnit = () => calculationMode === "european" ? "km" : "miles";
  const formatVolumeUnit = () => calculationMode === "european" ? "liters" : "gallons";
  const formatCurrencySymbol = () => calculationMode === "european" ? "€" : "$";
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <VideoBackground opacity={0.10} />
      
      <main className="flex-grow z-10 relative">
        <section className="py-20 px-6">
          <Container maxWidth="lg">
            <div className="mb-8">
              <div 
                onClick={() => window.location.href = "/apps"}
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </div>
            </div>
            
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                Fuel Calculator
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Calculate fuel consumption and costs for your trips in European or American units
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Fuel className="h-6 w-6 text-blue-400" />
                    Fuel Calculator
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Calculate fuel consumption and costs for your trips
                  </CardDescription>
                  
                  {/* Region Selection */}
                  <Tabs 
                    value={calculationMode} 
                    onValueChange={(value) => setCalculationMode(value as CalculationMode)}
                    className="mt-6"
                  >
                    <TabsList className="grid grid-cols-2 w-full bg-gray-800 p-1">
                      <TabsTrigger 
                        value="european" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                      >
                        European (Metric)
                      </TabsTrigger>
                      <TabsTrigger 
                        value="american"
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                      >
                        American (Imperial)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  {/* Input Form */}
                  <div className="space-y-4">
                    {/* Fuel Efficiency Selection - only for European mode */}
                    {calculationMode === "european" && (
                      <div className="mb-4">
                        <Label className="text-gray-300 mb-2 block">Fuel Efficiency Format</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            type="button" 
                            variant={fuelUnit === "kmPerLiter" ? "default" : "outline"}
                            className={fuelUnit === "kmPerLiter" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 text-gray-300"}
                            onClick={() => setFuelUnit("kmPerLiter")}
                          >
                            km/L
                          </Button>
                          <Button 
                            type="button" 
                            variant={fuelUnit === "litersPerKm" ? "default" : "outline"}
                            className={fuelUnit === "litersPerKm" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 text-gray-300"}
                            onClick={() => setFuelUnit("litersPerKm")}
                          >
                            L/100km
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Fuel Efficiency */}
                    <div className="space-y-2">
                      <Label htmlFor="fuel-efficiency" className="text-gray-300 flex items-center">
                        <FileBarChart className="h-4 w-4 mr-2 text-blue-400" />
                        Fuel Efficiency
                      </Label>
                      <div className="relative">
                        <Input
                          id="fuel-efficiency"
                          type="number"
                          value={fuelEfficiency}
                          onChange={(e) => setFuelEfficiency(e.target.value)}
                          className="bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white pr-16"
                          step="0.1"
                          min="0.1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          {calculationMode === "european" 
                            ? (fuelUnit === "kmPerLiter" ? "km/L" : "L/100km") 
                            : "mpg"}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {calculationMode === "european" 
                          ? (fuelUnit === "kmPerLiter" 
                              ? "Kilometers driven per liter of fuel" 
                              : "Liters used per 100 kilometers")
                          : "Miles driven per gallon of fuel"}
                      </p>
                    </div>
                    
                    {/* Distance */}
                    <div className="space-y-2">
                      <Label htmlFor="distance" className="text-gray-300 flex items-center">
                        <Navigation className="h-4 w-4 mr-2 text-blue-400" />
                        Trip Distance
                      </Label>
                      <div className="relative">
                        <Input
                          id="distance"
                          type="number"
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
                          className="bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white pr-16"
                          step="1"
                          min="1"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          {formatDistanceUnit()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Total distance for your trip
                      </p>
                    </div>
                    
                    {/* Fuel Price */}
                    <div className="space-y-2">
                      <Label htmlFor="fuel-price" className="text-gray-300 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-blue-400" />
                        Fuel Price
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                          {formatCurrencySymbol()}
                        </div>
                        <Input
                          id="fuel-price"
                          type="number"
                          value={fuelPrice}
                          onChange={(e) => setFuelPrice(e.target.value)}
                          className="bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white pl-8 pr-16"
                          step="0.01"
                          min="0.01"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                          per {formatVolumeUnit()}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        Current price of fuel
                      </p>
                    </div>
                    
                    {/* Calculate Button */}
                    <Button 
                      onClick={calculateFuelCost}
                      className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate
                    </Button>
                  </div>
                  
                  {/* Results Section */}
                  {calculationResult && (
                    <div className="bg-gray-800/50 rounded-lg p-5 text-sm mt-6 border border-gray-700">
                      <h4 className="font-medium mb-4 text-white text-lg flex items-center">
                        <FileBarChart className="h-5 w-5 mr-2 text-blue-400" /> 
                        Calculation Results
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-gray-400 mb-1">Total Fuel Used</div>
                          <div className="text-xl font-semibold text-white">
                            {calculationResult.totalFuelUsed.toFixed(2)} {formatVolumeUnit()}
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-gray-400 mb-1">Total Cost</div>
                          <div className="text-xl font-semibold text-white">
                            {formatCurrencySymbol()}{calculationResult.totalCost.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-gray-400 mb-1">Fuel Efficiency</div>
                          <div className="text-xl font-semibold text-white">
                            {calculationResult.fuelEfficiency}
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <div className="text-gray-400 mb-1">Cost per Distance</div>
                          <div className="text-xl font-semibold text-white">
                            {calculationResult.costPerDistance}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Tips Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 max-w-3xl mx-auto"
            >
              <h3 className="text-2xl font-semibold mb-6 text-center text-white">Fuel Efficiency Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10">
                  <h4 className="font-medium mb-3 text-lg text-blue-400">Driving Habits</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Avoid rapid acceleration and braking</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Maintain a steady speed on highways</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Use cruise control on long trips</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Avoid excessive idling</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10">
                  <h4 className="font-medium mb-3 text-lg text-blue-400">Vehicle Maintenance</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Keep tires properly inflated</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Regular engine tune-ups</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Use recommended grade of motor oil</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>Remove excess weight from your vehicle</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
            
            {/* Conversion Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 max-w-3xl mx-auto"
            >
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10 mt-6">
                <h4 className="font-medium mb-3 text-lg text-blue-400">Conversion Guide</h4>
                <div className="text-sm text-gray-400">
                  <p className="mb-2">Common fuel efficiency conversions:</p>
                  <ul className="space-y-1">
                    <li>• 1 mile per gallon (mpg) ≈ 0.425 km/L</li>
                    <li>• 1 km/L ≈ 2.352 miles per gallon (mpg)</li>
                    <li>• L/100km = 100 ÷ (km/L)</li>
                    <li>• km/L = 100 ÷ (L/100km)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}