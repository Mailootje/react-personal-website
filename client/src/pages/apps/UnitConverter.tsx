import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConversionCategory {
  id: string;
  name: string;
  units: {
    id: string;
    name: string;
    rate: number; // Conversion rate to the base unit
  }[];
}

export default function UnitConverter() {
  const [activeCategory, setActiveCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [result, setResult] = useState("");
  const [formula, setFormula] = useState("");

  const categories: ConversionCategory[] = [
    {
      id: "length",
      name: "Length",
      units: [
        { id: "mm", name: "Millimeters (mm)", rate: 0.001 },
        { id: "cm", name: "Centimeters (cm)", rate: 0.01 },
        { id: "m", name: "Meters (m)", rate: 1 },
        { id: "km", name: "Kilometers (km)", rate: 1000 },
        { id: "in", name: "Inches (in)", rate: 0.0254 },
        { id: "ft", name: "Feet (ft)", rate: 0.3048 },
        { id: "yd", name: "Yards (yd)", rate: 0.9144 },
        { id: "mi", name: "Miles (mi)", rate: 1609.344 },
      ],
    },
    {
      id: "weight",
      name: "Weight",
      units: [
        { id: "mg", name: "Milligrams (mg)", rate: 0.000001 },
        { id: "g", name: "Grams (g)", rate: 0.001 },
        { id: "kg", name: "Kilograms (kg)", rate: 1 },
        { id: "ton", name: "Metric Tons (t)", rate: 1000 },
        { id: "oz", name: "Ounces (oz)", rate: 0.0283495 },
        { id: "lb", name: "Pounds (lb)", rate: 0.453592 },
        { id: "st", name: "Stone (st)", rate: 6.35029 },
        { id: "uston", name: "US Tons (US t)", rate: 907.185 },
      ],
    },
    {
      id: "volume",
      name: "Volume",
      units: [
        { id: "ml", name: "Milliliters (ml)", rate: 0.001 },
        { id: "l", name: "Liters (L)", rate: 1 },
        { id: "m3", name: "Cubic Meters (m³)", rate: 1000 },
        { id: "pt", name: "Pints (pt)", rate: 0.473176 },
        { id: "qt", name: "Quarts (qt)", rate: 0.946353 },
        { id: "gal", name: "Gallons (gal)", rate: 3.78541 },
        { id: "floz", name: "Fluid Ounces (fl oz)", rate: 0.0295735 },
        { id: "cup", name: "Cups", rate: 0.236588 },
      ],
    },
    {
      id: "temperature",
      name: "Temperature",
      units: [
        { id: "c", name: "Celsius (°C)", rate: 1 },
        { id: "f", name: "Fahrenheit (°F)", rate: 1 },
        { id: "k", name: "Kelvin (K)", rate: 1 },
      ],
    },
    {
      id: "area",
      name: "Area",
      units: [
        { id: "mm2", name: "Square Millimeters (mm²)", rate: 0.000001 },
        { id: "cm2", name: "Square Centimeters (cm²)", rate: 0.0001 },
        { id: "m2", name: "Square Meters (m²)", rate: 1 },
        { id: "km2", name: "Square Kilometers (km²)", rate: 1000000 },
        { id: "ha", name: "Hectares (ha)", rate: 10000 },
        { id: "in2", name: "Square Inches (in²)", rate: 0.00064516 },
        { id: "ft2", name: "Square Feet (ft²)", rate: 0.092903 },
        { id: "ac", name: "Acres", rate: 4046.86 },
        { id: "mi2", name: "Square Miles (mi²)", rate: 2589988.11 },
      ],
    },
    {
      id: "speed",
      name: "Speed",
      units: [
        { id: "mps", name: "Meters per Second (m/s)", rate: 1 },
        { id: "kph", name: "Kilometers per Hour (km/h)", rate: 0.277778 },
        { id: "mph", name: "Miles per Hour (mph)", rate: 0.44704 },
        { id: "fps", name: "Feet per Second (ft/s)", rate: 0.3048 },
        { id: "knot", name: "Knots", rate: 0.514444 },
      ],
    },
    {
      id: "time",
      name: "Time",
      units: [
        { id: "ms", name: "Milliseconds (ms)", rate: 0.001 },
        { id: "s", name: "Seconds (s)", rate: 1 },
        { id: "min", name: "Minutes (min)", rate: 60 },
        { id: "h", name: "Hours (h)", rate: 3600 },
        { id: "d", name: "Days (d)", rate: 86400 },
        { id: "wk", name: "Weeks (wk)", rate: 604800 },
        { id: "mo", name: "Months (avg)", rate: 2628000 },
        { id: "yr", name: "Years (yr)", rate: 31536000 },
      ],
    },
    {
      id: "data",
      name: "Data",
      units: [
        { id: "b", name: "Bits (b)", rate: 0.125 },
        { id: "B", name: "Bytes (B)", rate: 1 },
        { id: "KB", name: "Kilobytes (KB)", rate: 1024 },
        { id: "MB", name: "Megabytes (MB)", rate: 1048576 },
        { id: "GB", name: "Gigabytes (GB)", rate: 1073741824 },
        { id: "TB", name: "Terabytes (TB)", rate: 1099511627776 },
        { id: "PB", name: "Petabytes (PB)", rate: 1125899906842624 },
      ],
    },
  ];

  // Set initial units when category changes
  useEffect(() => {
    const category = categories.find((c) => c.id === activeCategory);
    if (category && category.units.length >= 2) {
      setFromUnit(category.units[0].id);
      setToUnit(category.units[1].id);
      setResult("");
      setFormula("");
    }
  }, [activeCategory]);

  // Calculate conversion when inputs change
  useEffect(() => {
    if (fromUnit && toUnit && fromValue && !isNaN(parseFloat(fromValue))) {
      convert();
    }
  }, [fromUnit, toUnit, fromValue]);

  const convert = () => {
    if (!fromUnit || !toUnit || !fromValue || isNaN(parseFloat(fromValue))) {
      setResult("");
      setFormula("");
      return;
    }

    const category = categories.find((c) => c.id === activeCategory);
    if (!category) return;

    const fromUnitObj = category.units.find((u) => u.id === fromUnit);
    const toUnitObj = category.units.find((u) => u.id === toUnit);

    if (!fromUnitObj || !toUnitObj) return;

    const value = parseFloat(fromValue);

    // Special case for temperature conversions
    if (activeCategory === "temperature") {
      let resultValue = 0;
      let formulaText = "";

      if (fromUnit === "c" && toUnit === "f") {
        resultValue = value * 9/5 + 32;
        formulaText = `${value}°C × (9/5) + 32 = ${resultValue.toFixed(4)}°F`;
      } else if (fromUnit === "f" && toUnit === "c") {
        resultValue = (value - 32) * 5/9;
        formulaText = `(${value}°F - 32) × (5/9) = ${resultValue.toFixed(4)}°C`;
      } else if (fromUnit === "c" && toUnit === "k") {
        resultValue = value + 273.15;
        formulaText = `${value}°C + 273.15 = ${resultValue.toFixed(4)}K`;
      } else if (fromUnit === "k" && toUnit === "c") {
        resultValue = value - 273.15;
        formulaText = `${value}K - 273.15 = ${resultValue.toFixed(4)}°C`;
      } else if (fromUnit === "f" && toUnit === "k") {
        resultValue = (value - 32) * 5/9 + 273.15;
        formulaText = `(${value}°F - 32) × (5/9) + 273.15 = ${resultValue.toFixed(4)}K`;
      } else if (fromUnit === "k" && toUnit === "f") {
        resultValue = (value - 273.15) * 9/5 + 32;
        formulaText = `(${value}K - 273.15) × (9/5) + 32 = ${resultValue.toFixed(4)}°F`;
      } else {
        // Same unit, no conversion needed
        resultValue = value;
        formulaText = `${value}${fromUnit === "c" ? "°C" : fromUnit === "f" ? "°F" : "K"} = ${value}${toUnit === "c" ? "°C" : toUnit === "f" ? "°F" : "K"}`;
      }

      setResult(resultValue.toString());
      setFormula(formulaText);
    } else {
      // For all other conversions, use the rate-based conversion
      const baseValue = value * fromUnitObj.rate;
      const resultValue = baseValue / toUnitObj.rate;
      
      setResult(resultValue.toString());
      setFormula(
        `${value} ${fromUnitObj.name.split(" ")[0]} × ${fromUnitObj.rate} = ${baseValue.toFixed(6)} base units\n` +
        `${baseValue.toFixed(6)} base units ÷ ${toUnitObj.rate} = ${resultValue.toFixed(6)} ${toUnitObj.name.split(" ")[0]}`
      );
    }
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // Format the result for display
  const formattedResult = () => {
    if (!result) return "";
    
    const num = parseFloat(result);
    if (isNaN(num)) return result;
    
    // If the number is very large or very small, use scientific notation
    if (num > 1e12 || (num < 1e-6 && num !== 0)) {
      return num.toExponential(6);
    }
    
    // Otherwise format with appropriate decimal places
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(6).replace(/\.?0+$/, '');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="lg">
            <div className="mb-8">
              <div 
                onClick={() => window.location.href = "/apps"}
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors cursor-pointer"
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Unit Converter</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Convert between different units of measurement
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Convert Units</CardTitle>
                  <CardDescription>
                    Select a category and units to convert between
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category selection tabs */}
                  <Tabs 
                    defaultValue={activeCategory} 
                    onValueChange={setActiveCategory}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-4 md:grid-cols-8">
                      {categories.map((category) => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id}
                          className="text-xs md:text-sm"
                        >
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {categories.map((category) => (
                      <TabsContent key={category.id} value={category.id} className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">From:</label>
                              <div className="space-y-2">
                                <Select
                                  value={fromUnit}
                                  onValueChange={setFromUnit}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {category.units.map((unit) => (
                                      <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  placeholder="Enter value"
                                  value={fromValue}
                                  onChange={(e) => setFromValue(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-center md:block">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={swapUnits}
                              className="rotate-90 md:rotate-0"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4 md:col-start-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">To:</label>
                              <div className="space-y-2">
                                <Select
                                  value={toUnit}
                                  onValueChange={setToUnit}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {category.units.map((unit) => (
                                      <SelectItem key={unit.id} value={unit.id}>
                                        {unit.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  readOnly
                                  value={formattedResult()}
                                  className="bg-muted"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Formula explanation */}
                        {formula && (
                          <div className="p-4 border rounded-md bg-muted/50 mt-4">
                            <h3 className="text-sm font-medium mb-2">Conversion Formula:</h3>
                            <pre className="text-xs whitespace-pre-wrap font-mono">{formula}</pre>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-3xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">About Unit Conversion</h2>
              <p className="mb-4 text-muted-foreground">
                Unit conversion is the process of changing a measurement from one unit to another equivalent value. The conversion relies on conversion factors that define the relationship between different units.
              </p>
              <p className="text-muted-foreground">
                For most conversions, we first convert the input value to a base unit (e.g., meters for length, kilograms for weight) and then convert from the base unit to the target unit. Temperature conversions use special formulas due to their different scales and zero points.
              </p>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}