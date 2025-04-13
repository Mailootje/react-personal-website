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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  ArrowRight,
  RefreshCw,
  Ruler,
  Scale,
  Thermometer,
  Clock,
  BarChart3,
  Star,
  Waves,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define conversion categories
type ConversionCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  units: UnitOption[];
};

type UnitOption = {
  id: string;
  name: string;
  convertTo: (value: number, toUnitId: string) => number;
};

// Length units
const lengthUnits: UnitOption[] = [
  {
    id: "meter",
    name: "Meters (m)",
    convertTo: (value, toUnitId) => {
      const meterValue = value; // Already in meters
      switch (toUnitId) {
        case "meter": return meterValue;
        case "kilometer": return meterValue / 1000;
        case "centimeter": return meterValue * 100;
        case "millimeter": return meterValue * 1000;
        case "inch": return meterValue * 39.3701;
        case "foot": return meterValue * 3.28084;
        case "yard": return meterValue * 1.09361;
        case "mile": return meterValue * 0.000621371;
        default: return meterValue;
      }
    }
  },
  {
    id: "kilometer",
    name: "Kilometers (km)",
    convertTo: (value, toUnitId) => {
      const meterValue = value * 1000;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "centimeter",
    name: "Centimeters (cm)",
    convertTo: (value, toUnitId) => {
      const meterValue = value / 100;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "millimeter",
    name: "Millimeters (mm)",
    convertTo: (value, toUnitId) => {
      const meterValue = value / 1000;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "inch",
    name: "Inches (in)",
    convertTo: (value, toUnitId) => {
      const meterValue = value * 0.0254;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "foot",
    name: "Feet (ft)",
    convertTo: (value, toUnitId) => {
      const meterValue = value * 0.3048;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "yard",
    name: "Yards (yd)",
    convertTo: (value, toUnitId) => {
      const meterValue = value * 0.9144;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  },
  {
    id: "mile",
    name: "Miles (mi)",
    convertTo: (value, toUnitId) => {
      const meterValue = value * 1609.34;
      return lengthUnits.find(unit => unit.id === "meter")!.convertTo(meterValue, toUnitId);
    }
  }
];

// Weight/Mass units
const weightUnits: UnitOption[] = [
  {
    id: "kilogram",
    name: "Kilograms (kg)",
    convertTo: (value, toUnitId) => {
      const kgValue = value; // Already in kg
      switch (toUnitId) {
        case "kilogram": return kgValue;
        case "gram": return kgValue * 1000;
        case "milligram": return kgValue * 1000000;
        case "pound": return kgValue * 2.20462;
        case "ounce": return kgValue * 35.274;
        case "ton": return kgValue * 0.001;
        case "stone": return kgValue * 0.157473;
        default: return kgValue;
      }
    }
  },
  {
    id: "gram",
    name: "Grams (g)",
    convertTo: (value, toUnitId) => {
      const kgValue = value / 1000;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  },
  {
    id: "milligram",
    name: "Milligrams (mg)",
    convertTo: (value, toUnitId) => {
      const kgValue = value / 1000000;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  },
  {
    id: "pound",
    name: "Pounds (lb)",
    convertTo: (value, toUnitId) => {
      const kgValue = value * 0.453592;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  },
  {
    id: "ounce",
    name: "Ounces (oz)",
    convertTo: (value, toUnitId) => {
      const kgValue = value * 0.0283495;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  },
  {
    id: "ton",
    name: "Metric Tons (t)",
    convertTo: (value, toUnitId) => {
      const kgValue = value * 1000;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  },
  {
    id: "stone",
    name: "Stone (st)",
    convertTo: (value, toUnitId) => {
      const kgValue = value * 6.35029;
      return weightUnits.find(unit => unit.id === "kilogram")!.convertTo(kgValue, toUnitId);
    }
  }
];

// Temperature units
const temperatureUnits: UnitOption[] = [
  {
    id: "celsius",
    name: "Celsius (°C)",
    convertTo: (value, toUnitId) => {
      const celsiusValue = value; // Already in Celsius
      switch (toUnitId) {
        case "celsius": return celsiusValue;
        case "fahrenheit": return (celsiusValue * 9/5) + 32;
        case "kelvin": return celsiusValue + 273.15;
        default: return celsiusValue;
      }
    }
  },
  {
    id: "fahrenheit",
    name: "Fahrenheit (°F)",
    convertTo: (value, toUnitId) => {
      const celsiusValue = (value - 32) * 5/9;
      return temperatureUnits.find(unit => unit.id === "celsius")!.convertTo(celsiusValue, toUnitId);
    }
  },
  {
    id: "kelvin",
    name: "Kelvin (K)",
    convertTo: (value, toUnitId) => {
      const celsiusValue = value - 273.15;
      return temperatureUnits.find(unit => unit.id === "celsius")!.convertTo(celsiusValue, toUnitId);
    }
  }
];

// Time units
const timeUnits: UnitOption[] = [
  {
    id: "second",
    name: "Seconds (s)",
    convertTo: (value, toUnitId) => {
      const secondValue = value; // Already in seconds
      switch (toUnitId) {
        case "second": return secondValue;
        case "minute": return secondValue / 60;
        case "hour": return secondValue / 3600;
        case "day": return secondValue / 86400;
        case "week": return secondValue / 604800;
        case "month": return secondValue / 2592000; // Approximation (30 days)
        case "year": return secondValue / 31536000; // Approximation (365 days)
        default: return secondValue;
      }
    }
  },
  {
    id: "minute",
    name: "Minutes (min)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 60;
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  },
  {
    id: "hour",
    name: "Hours (hr)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 3600;
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  },
  {
    id: "day",
    name: "Days (d)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 86400;
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  },
  {
    id: "week",
    name: "Weeks (wk)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 604800;
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  },
  {
    id: "month",
    name: "Months (mo)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 2592000; // Approximation (30 days)
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  },
  {
    id: "year",
    name: "Years (yr)",
    convertTo: (value, toUnitId) => {
      const secondValue = value * 31536000; // Approximation (365 days)
      return timeUnits.find(unit => unit.id === "second")!.convertTo(secondValue, toUnitId);
    }
  }
];

// Pressure units
const pressureUnits: UnitOption[] = [
  {
    id: "pascal",
    name: "Pascal (Pa)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value; // Already in Pascal
      switch (toUnitId) {
        case "pascal": return pascalValue;
        case "kilopascal": return pascalValue / 1000;
        case "bar": return pascalValue / 100000;
        case "atmosphere": return pascalValue / 101325;
        case "mmHg": return pascalValue / 133.322;
        case "psi": return pascalValue / 6894.76;
        default: return pascalValue;
      }
    }
  },
  {
    id: "kilopascal",
    name: "Kilopascal (kPa)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value * 1000;
      return pressureUnits.find(unit => unit.id === "pascal")!.convertTo(pascalValue, toUnitId);
    }
  },
  {
    id: "bar",
    name: "Bar (bar)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value * 100000;
      return pressureUnits.find(unit => unit.id === "pascal")!.convertTo(pascalValue, toUnitId);
    }
  },
  {
    id: "atmosphere",
    name: "Atmosphere (atm)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value * 101325;
      return pressureUnits.find(unit => unit.id === "pascal")!.convertTo(pascalValue, toUnitId);
    }
  },
  {
    id: "mmHg",
    name: "Millimeters of Mercury (mmHg)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value * 133.322;
      return pressureUnits.find(unit => unit.id === "pascal")!.convertTo(pascalValue, toUnitId);
    }
  },
  {
    id: "psi",
    name: "Pounds per Square Inch (psi)",
    convertTo: (value, toUnitId) => {
      const pascalValue = value * 6894.76;
      return pressureUnits.find(unit => unit.id === "pascal")!.convertTo(pascalValue, toUnitId);
    }
  }
];

// Energy units
const energyUnits: UnitOption[] = [
  {
    id: "joule",
    name: "Joule (J)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value; // Already in Joules
      switch (toUnitId) {
        case "joule": return jouleValue;
        case "kilojoule": return jouleValue / 1000;
        case "calorie": return jouleValue / 4.184;
        case "kilocalorie": return jouleValue / 4184;
        case "wattHour": return jouleValue / 3600;
        case "kilowattHour": return jouleValue / 3600000;
        case "electronvolt": return jouleValue / 1.602e-19;
        case "btu": return jouleValue / 1055.06;
        default: return jouleValue;
      }
    }
  },
  {
    id: "kilojoule",
    name: "Kilojoule (kJ)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 1000;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "calorie",
    name: "Calorie (cal)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 4.184;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "kilocalorie",
    name: "Kilocalorie (kcal)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 4184;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "wattHour",
    name: "Watt-hour (Wh)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 3600;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "kilowattHour",
    name: "Kilowatt-hour (kWh)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 3600000;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "electronvolt",
    name: "Electronvolt (eV)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 1.602e-19;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  },
  {
    id: "btu",
    name: "British Thermal Unit (BTU)",
    convertTo: (value, toUnitId) => {
      const jouleValue = value * 1055.06;
      return energyUnits.find(unit => unit.id === "joule")!.convertTo(jouleValue, toUnitId);
    }
  }
];

// Volume units
const volumeUnits: UnitOption[] = [
  {
    id: "liter",
    name: "Liter (L)",
    convertTo: (value, toUnitId) => {
      const literValue = value; // Already in Liters
      switch (toUnitId) {
        case "liter": return literValue;
        case "milliliter": return literValue * 1000;
        case "cubicMeter": return literValue / 1000;
        case "gallon": return literValue * 0.264172;
        case "quart": return literValue * 1.05669;
        case "pint": return literValue * 2.11338;
        case "cup": return literValue * 4.22675;
        case "fluidOunce": return literValue * 33.814;
        case "tablespoon": return literValue * 67.628;
        case "teaspoon": return literValue * 202.884;
        case "cubicInch": return literValue * 61.0237;
        case "cubicFoot": return literValue * 0.0353147;
        default: return literValue;
      }
    }
  },
  {
    id: "milliliter",
    name: "Milliliter (mL)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 1000;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "cubicMeter",
    name: "Cubic Meter (m³)",
    convertTo: (value, toUnitId) => {
      const literValue = value * 1000;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "gallon",
    name: "Gallon (gal)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 0.264172;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "quart",
    name: "Quart (qt)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 1.05669;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "pint",
    name: "Pint (pt)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 2.11338;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "cup",
    name: "Cup (c)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 4.22675;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  },
  {
    id: "fluidOunce",
    name: "Fluid Ounce (fl oz)",
    convertTo: (value, toUnitId) => {
      const literValue = value / 33.814;
      return volumeUnits.find(unit => unit.id === "liter")!.convertTo(literValue, toUnitId);
    }
  }
];

// Speed units
const speedUnits: UnitOption[] = [
  {
    id: "meterPerSecond",
    name: "Meter per Second (m/s)",
    convertTo: (value, toUnitId) => {
      const mpsValue = value; // Already in m/s
      switch (toUnitId) {
        case "meterPerSecond": return mpsValue;
        case "kilometerPerHour": return mpsValue * 3.6;
        case "milePerHour": return mpsValue * 2.23694;
        case "knot": return mpsValue * 1.94384;
        case "footPerSecond": return mpsValue * 3.28084;
        default: return mpsValue;
      }
    }
  },
  {
    id: "kilometerPerHour",
    name: "Kilometer per Hour (km/h)",
    convertTo: (value, toUnitId) => {
      const mpsValue = value / 3.6;
      return speedUnits.find(unit => unit.id === "meterPerSecond")!.convertTo(mpsValue, toUnitId);
    }
  },
  {
    id: "milePerHour",
    name: "Mile per Hour (mph)",
    convertTo: (value, toUnitId) => {
      const mpsValue = value / 2.23694;
      return speedUnits.find(unit => unit.id === "meterPerSecond")!.convertTo(mpsValue, toUnitId);
    }
  },
  {
    id: "knot",
    name: "Knot (kn)",
    convertTo: (value, toUnitId) => {
      const mpsValue = value / 1.94384;
      return speedUnits.find(unit => unit.id === "meterPerSecond")!.convertTo(mpsValue, toUnitId);
    }
  },
  {
    id: "footPerSecond",
    name: "Foot per Second (ft/s)",
    convertTo: (value, toUnitId) => {
      const mpsValue = value / 3.28084;
      return speedUnits.find(unit => unit.id === "meterPerSecond")!.convertTo(mpsValue, toUnitId);
    }
  }
];

// Define all conversion categories
const conversionCategories: ConversionCategory[] = [
  {
    id: "length",
    name: "Length",
    icon: <Ruler className="h-5 w-5" />,
    units: lengthUnits
  },
  {
    id: "weight",
    name: "Weight",
    icon: <Scale className="h-5 w-5" />,
    units: weightUnits
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: <Thermometer className="h-5 w-5" />,
    units: temperatureUnits
  },
  {
    id: "time",
    name: "Time",
    icon: <Clock className="h-5 w-5" />,
    units: timeUnits
  },
  {
    id: "pressure",
    name: "Pressure",
    icon: <BarChart3 className="h-5 w-5" />,
    units: pressureUnits
  },
  {
    id: "energy",
    name: "Energy",
    icon: <Zap className="h-5 w-5" />,
    units: energyUnits
  },
  {
    id: "volume",
    name: "Volume",
    icon: <Waves className="h-5 w-5" />,
    units: volumeUnits
  },
  {
    id: "speed",
    name: "Speed",
    icon: <Star className="h-5 w-5" />,
    units: speedUnits
  }
];

export default function UnitConverter() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("length");
  const [inputValue, setInputValue] = useState<string>("1");
  const [convertedValue, setConvertedValue] = useState<string>("");
  const [fromUnitId, setFromUnitId] = useState<string>("");
  const [toUnitId, setToUnitId] = useState<string>("");
  const [converting, setConverting] = useState<boolean>(false);
  
  // Get the current category
  const currentCategory = conversionCategories.find(cat => cat.id === activeCategory) || conversionCategories[0];
  
  // Set default units when category changes
  useEffect(() => {
    if (currentCategory && currentCategory.units.length > 0) {
      setFromUnitId(currentCategory.units[0].id);
      setToUnitId(currentCategory.units.length > 1 ? currentCategory.units[1].id : currentCategory.units[0].id);
      convert();
    }
  }, [activeCategory]);
  
  // Auto-convert when values change
  useEffect(() => {
    convert();
  }, [fromUnitId, toUnitId, inputValue]);
  
  // Swap from and to units
  const swapUnits = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };
  
  // Convert units
  const convert = () => {
    if (!fromUnitId || !toUnitId || !inputValue) {
      setConvertedValue("");
      return;
    }
    
    try {
      setConverting(true);
      
      // Parse input value
      const numericValue = parseFloat(inputValue);
      
      if (isNaN(numericValue)) {
        setConvertedValue("Invalid number");
        return;
      }
      
      // Find the conversion units
      const fromUnit = currentCategory.units.find(unit => unit.id === fromUnitId);
      
      if (!fromUnit) {
        setConvertedValue("Invalid unit");
        return;
      }
      
      // Convert
      const result = fromUnit.convertTo(numericValue, toUnitId);
      
      // Format the result based on its magnitude
      if (Math.abs(result) < 0.00001 || Math.abs(result) >= 100000) {
        // Use scientific notation for very small or very large numbers
        setConvertedValue(result.toExponential(6));
      } else if (Number.isInteger(result)) {
        // Whole numbers
        setConvertedValue(result.toString());
      } else {
        // Regular decimal numbers
        setConvertedValue(result.toPrecision(7).replace(/\.?0+$/, ""));
      }
    } catch (error) {
      console.error("Conversion error:", error);
      setConvertedValue("Error");
      toast({
        title: "Conversion Error",
        description: "An error occurred during conversion",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };
  
  // Get the FromUnit and ToUnit objects for displaying unit names
  const fromUnit = currentCategory.units.find(unit => unit.id === fromUnitId);
  const toUnit = currentCategory.units.find(unit => unit.id === toUnitId);
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <div className="fixed inset-0 z-0 bg-black">
        <video 
          className="absolute h-full w-full object-cover opacity-10"
          autoPlay 
          loop 
          muted 
          playsInline
          style={{ filter: 'blur(2px)' }}
        >
          <source src="/assets/videos/background.webm" type="video/webm" />
          <source src="/assets/videos/background.mp4" type="video/mp4" />
        </video>
      </div>
      
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
                Unit Converter
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Convert between different units of measurement precisely and instantly
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <CardTitle className="text-2xl text-white">Unit Converter</CardTitle>
                  <CardDescription className="text-gray-400">
                    Select a category and units to convert between
                  </CardDescription>
                  
                  {/* Category Tabs */}
                  <Tabs 
                    value={activeCategory} 
                    onValueChange={setActiveCategory}
                    className="mt-6"
                  >
                    <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full bg-gray-800 p-1">
                      {conversionCategories.map(cat => (
                        <TabsTrigger 
                          key={cat.id} 
                          value={cat.id}
                          className="flex items-center justify-center data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                          <span className="hidden lg:inline-flex items-center">
                            <span className="mr-2 text-blue-400">{cat.icon}</span>
                            {cat.name}
                          </span>
                          <span className="lg:hidden flex items-center flex-col gap-1 py-1">
                            <span className="text-blue-400">{cat.icon}</span>
                            <span className="text-xs">{cat.name}</span>
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{currentCategory.name} Converter</h3>
                    <p className="text-gray-400 text-sm">
                      Convert between different {currentCategory.name.toLowerCase()} units
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    {/* From Unit Input */}
                    <div className="md:col-span-5 space-y-3">
                      <Label htmlFor="from-value" className="text-gray-300 flex items-center text-sm font-medium">
                        <span className="text-blue-400 mr-2">From</span>
                        {fromUnit && <span className="text-xs text-gray-400">({fromUnit.name})</span>}
                      </Label>
                      <div className="space-y-3">
                        <Input
                          id="from-value"
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="font-mono bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white"
                        />
                        <Select
                          value={fromUnitId}
                          onValueChange={setFromUnitId}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {currentCategory.units.map(unit => (
                              <SelectItem key={unit.id} value={unit.id} className="focus:bg-blue-600 focus:text-white">
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Swap Button */}
                    <div className="flex justify-center md:col-span-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={swapUnits}
                        className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 border-none text-white transform transition-transform hover:scale-110"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* To Unit Input */}
                    <div className="md:col-span-5 space-y-3">
                      <Label htmlFor="to-value" className="text-gray-300 flex items-center text-sm font-medium">
                        <span className="text-blue-400 mr-2">To</span>
                        {toUnit && <span className="text-xs text-gray-400">({toUnit.name})</span>}
                      </Label>
                      <div className="space-y-3">
                        <Input
                          id="to-value"
                          type="text"
                          value={convertedValue}
                          readOnly
                          className="font-mono bg-gray-800 border-gray-700 text-white"
                        />
                        <Select
                          value={toUnitId}
                          onValueChange={setToUnitId}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {currentCategory.units.map(unit => (
                              <SelectItem key={unit.id} value={unit.id} className="focus:bg-blue-600 focus:text-white">
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conversion Information */}
                  <div className="bg-gray-800/50 rounded-lg p-5 text-sm mt-6 border border-gray-700">
                    <h4 className="font-medium mb-2 text-white flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 text-blue-400" /> 
                      Conversion Formula
                    </h4>
                    <p className="text-gray-400">
                      {activeCategory === "temperature" ? (
                        <>
                          Temperature conversions:
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Celsius to Fahrenheit: °F = (°C × 9/5) + 32</li>
                            <li>Fahrenheit to Celsius: °C = (°F - 32) × 5/9</li>
                            <li>Celsius to Kelvin: K = °C + 273.15</li>
                            <li>Kelvin to Celsius: °C = K - 273.15</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          This converter uses standard conversion factors for {currentCategory.name.toLowerCase()} units. 
                          All conversions are performed using the base unit as an intermediary.
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Common Conversions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 max-w-3xl mx-auto"
            >
              <h3 className="text-2xl font-semibold mb-6 text-center text-white">Common Conversions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10 transform transition-transform hover:scale-105">
                  <h4 className="font-medium mb-3 text-lg text-blue-400">1 Meter (m)</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex justify-between">
                      <span>100 cm</span>
                      <span className="text-gray-500">centimeters</span>
                    </li>
                    <li className="flex justify-between">
                      <span>1,000 mm</span>
                      <span className="text-gray-500">millimeters</span>
                    </li>
                    <li className="flex justify-between">
                      <span>0.001 km</span>
                      <span className="text-gray-500">kilometers</span>
                    </li>
                    <li className="flex justify-between">
                      <span>39.37 in</span>
                      <span className="text-gray-500">inches</span>
                    </li>
                    <li className="flex justify-between">
                      <span>3.28 ft</span>
                      <span className="text-gray-500">feet</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10 transform transition-transform hover:scale-105">
                  <h4 className="font-medium mb-3 text-lg text-blue-400">1 Kilogram (kg)</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex justify-between">
                      <span>1,000 g</span>
                      <span className="text-gray-500">grams</span>
                    </li>
                    <li className="flex justify-between">
                      <span>1,000,000 mg</span>
                      <span className="text-gray-500">milligrams</span>
                    </li>
                    <li className="flex justify-between">
                      <span>2.205 lb</span>
                      <span className="text-gray-500">pounds</span>
                    </li>
                    <li className="flex justify-between">
                      <span>35.274 oz</span>
                      <span className="text-gray-500">ounces</span>
                    </li>
                    <li className="flex justify-between">
                      <span>0.157 st</span>
                      <span className="text-gray-500">stone</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 shadow-lg shadow-blue-900/10 transform transition-transform hover:scale-105">
                  <h4 className="font-medium mb-3 text-lg text-blue-400">Temperature</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex justify-between">
                      <span>0°C</span>
                      <span className="text-gray-500">32°F / 273.15K</span>
                    </li>
                    <li className="flex justify-between">
                      <span>20°C</span>
                      <span className="text-gray-500">68°F / 293.15K</span>
                    </li>
                    <li className="flex justify-between">
                      <span>37°C</span>
                      <span className="text-gray-500">98.6°F / 310.15K</span>
                    </li>
                    <li className="flex justify-between">
                      <span>100°C</span>
                      <span className="text-gray-500">212°F / 373.15K</span>
                    </li>
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