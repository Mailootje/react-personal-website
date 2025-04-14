import { useState, useEffect, useRef } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import jsPDF from "jspdf";
import { 
  ArrowLeft, 
  Lightbulb,
  Zap,
  Clock,
  Calendar,
  Layers,
  BarChart3,
  PlusCircle,
  Trash2,
  Calculator,
  DollarSign,
  Settings,
  Save,
  Download,
  FileDown,
  BadgePlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoBackground } from "@/components/VideoBackground";

// Common device power ratings in watts
interface DevicePreset {
  name: string;
  category: string;
  powerWatts: number;
}

interface Device {
  id: string;
  name: string;
  powerWatts: number;
  hoursPerDay: number;
  daysPerWeek: number;
  quantity: number;
  standbyWatts?: number;
  efficiency?: number;
}

interface PowerCalculationResult {
  dailyUsage: {
    kWh: number;
    cost: number;
  };
  weeklyUsage: {
    kWh: number;
    cost: number;
  };
  monthlyUsage: {
    kWh: number;
    cost: number;
  };
  yearlyUsage: {
    kWh: number;
    cost: number;
  };
  co2Emissions: {
    yearly: number; // in kg
  };
}

// Common device presets
const devicePresets: DevicePreset[] = [
  // Computer & Electronics
  { name: "Desktop Computer (idle)", category: "Computer & Electronics", powerWatts: 100 },
  { name: "Desktop Computer (gaming)", category: "Computer & Electronics", powerWatts: 350 },
  { name: "Laptop Computer", category: "Computer & Electronics", powerWatts: 60 },
  { name: "Monitor (24-inch LCD)", category: "Computer & Electronics", powerWatts: 30 },
  { name: "Gaming Console", category: "Computer & Electronics", powerWatts: 150 },
  { name: "Printer (inkjet)", category: "Computer & Electronics", powerWatts: 30 },
  { name: "Printer (laser)", category: "Computer & Electronics", powerWatts: 500 },
  { name: "Wi-Fi Router", category: "Computer & Electronics", powerWatts: 5 },
  { name: "Mobile Phone Charger", category: "Computer & Electronics", powerWatts: 5 },
  
  // Kitchen Appliances
  { name: "Refrigerator", category: "Kitchen Appliances", powerWatts: 150 },
  { name: "Freezer", category: "Kitchen Appliances", powerWatts: 100 },
  { name: "Microwave Oven", category: "Kitchen Appliances", powerWatts: 1000 },
  { name: "Electric Oven", category: "Kitchen Appliances", powerWatts: 2400 },
  { name: "Cooktop (per element)", category: "Kitchen Appliances", powerWatts: 1500 },
  { name: "Dishwasher", category: "Kitchen Appliances", powerWatts: 1800 },
  { name: "Coffee Maker", category: "Kitchen Appliances", powerWatts: 1000 },
  { name: "Toaster", category: "Kitchen Appliances", powerWatts: 850 },
  { name: "Blender", category: "Kitchen Appliances", powerWatts: 300 },
  
  // Home Appliances
  { name: "Washing Machine", category: "Home Appliances", powerWatts: 500 },
  { name: "Clothes Dryer", category: "Home Appliances", powerWatts: 3000 },
  { name: "Vacuum Cleaner", category: "Home Appliances", powerWatts: 1400 },
  { name: "Iron", category: "Home Appliances", powerWatts: 1800 },
  { name: "Hair Dryer", category: "Home Appliances", powerWatts: 1800 },
  
  // HVAC & Climate Control
  { name: "Air Conditioner (window)", category: "HVAC & Climate Control", powerWatts: 1000 },
  { name: "Air Conditioner (central)", category: "HVAC & Climate Control", powerWatts: 3500 },
  { name: "Electric Heater (portable)", category: "HVAC & Climate Control", powerWatts: 1500 },
  { name: "Ceiling Fan", category: "HVAC & Climate Control", powerWatts: 75 },
  { name: "Dehumidifier", category: "HVAC & Climate Control", powerWatts: 280 },
  
  // Lighting
  { name: "LED Light Bulb", category: "Lighting", powerWatts: 10 },
  { name: "CFL Light Bulb", category: "Lighting", powerWatts: 15 },
  { name: "Incandescent Light Bulb", category: "Lighting", powerWatts: 60 },
  
  // Entertainment
  { name: "TV (LED, 32-inch)", category: "Entertainment", powerWatts: 50 },
  { name: "TV (LED, 50-inch)", category: "Entertainment", powerWatts: 100 },
  { name: "TV (OLED, 55-inch)", category: "Entertainment", powerWatts: 130 },
  { name: "Home Theater System", category: "Entertainment", powerWatts: 100 },
  { name: "Stereo System", category: "Entertainment", powerWatts: 80 },
  
  // Other
  { name: "Electric Vehicle Charger (Level 1)", category: "Other", powerWatts: 1400 },
  { name: "Electric Vehicle Charger (Level 2)", category: "Other", powerWatts: 7200 },
  { name: "Pool Pump", category: "Other", powerWatts: 1500 },
  { name: "Water Heater", category: "Other", powerWatts: 4000 },
];

// Group presets by category
const devicePresetsByCategory = devicePresets.reduce((acc, device) => {
  if (!acc[device.category]) {
    acc[device.category] = [];
  }
  acc[device.category].push(device);
  return acc;
}, {} as Record<string, DevicePreset[]>);

// All categories
const categories = Object.keys(devicePresetsByCategory);

export default function PowerCalculator() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Desktop Computer',
      powerWatts: 150,
      hoursPerDay: 8,
      daysPerWeek: 5,
      quantity: 1,
      standbyWatts: 5
    }
  ]);
  const [electricityRate, setElectricityRate] = useState<string>("0.15");
  const [currency, setCurrency] = useState<string>("USD");
  const [calculationResult, setCalculationResult] = useState<PowerCalculationResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);
  const [includeStandby, setIncludeStandby] = useState<boolean>(true);
  const [co2PerKwh, setCo2PerKwh] = useState<string>("0.5");
  
  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 10);
  
  // Add a new device
  const addDevice = (preset?: DevicePreset) => {
    const newDevice: Device = {
      id: generateId(),
      name: preset?.name || 'New Device',
      powerWatts: preset?.powerWatts || 100,
      hoursPerDay: 1,
      daysPerWeek: 7,
      quantity: 1,
      standbyWatts: 0
    };
    
    setDevices([...devices, newDevice]);
  };
  
  // Add device from preset
  const addPresetDevice = (preset: DevicePreset) => {
    addDevice(preset);
    toast({
      title: `Added ${preset.name}`,
      description: `${preset.powerWatts} watts added to your calculation.`,
    });
  };
  
  // Remove a device
  const removeDevice = (id: string) => {
    setDevices(devices.filter(device => device.id !== id));
  };
  
  // Update device property
  const updateDevice = (id: string, property: keyof Device, value: number | string) => {
    setDevices(devices.map(device => {
      if (device.id === id) {
        return {
          ...device,
          [property]: typeof value === 'string' && property !== 'name' ? parseFloat(value) : value
        };
      }
      return device;
    }));
  };
  
  // Calculate electricity usage and cost
  const calculatePowerUsage = () => {
    try {
      // Validate inputs
      const rate = parseFloat(electricityRate);
      if (isNaN(rate) || rate <= 0) {
        throw new Error("Please enter a valid electricity rate");
      }
      
      const co2EmissionFactor = parseFloat(co2PerKwh);
      if (isNaN(co2EmissionFactor) || co2EmissionFactor < 0) {
        throw new Error("Please enter a valid CO2 emission factor");
      }
      
      // Calculate total kWh and cost
      let totalDailyKwh = 0;
      
      devices.forEach(device => {
        // Validate device inputs
        if (isNaN(device.powerWatts) || device.powerWatts < 0 ||
            isNaN(device.hoursPerDay) || device.hoursPerDay < 0 ||
            isNaN(device.daysPerWeek) || device.daysPerWeek < 0 || device.daysPerWeek > 7 ||
            isNaN(device.quantity) || device.quantity < 1) {
          throw new Error(`Invalid values for device: ${device.name}`);
        }
        
        // Calculate active power usage
        const dailyActiveHours = device.hoursPerDay;
        const dailyKwh = (device.powerWatts * dailyActiveHours * device.quantity) / 1000;
        
        // Add standby power if enabled
        let standbyKwh = 0;
        if (includeStandby && device.standbyWatts && device.standbyWatts > 0) {
          const dailyStandbyHours = 24 - dailyActiveHours;
          standbyKwh = (device.standbyWatts * dailyStandbyHours * device.quantity) / 1000;
        }
        
        // Calculate total daily kWh for this device
        const deviceDailyKwh = dailyKwh + standbyKwh;
        const daysRatio = device.daysPerWeek / 7;
        
        // Add to total daily average (accounting for days per week)
        totalDailyKwh += deviceDailyKwh * daysRatio;
      });
      
      // Calculate periods
      const dailyCost = totalDailyKwh * rate;
      const weeklyKwh = totalDailyKwh * 7;
      const weeklyCost = weeklyKwh * rate;
      const monthlyKwh = totalDailyKwh * 30.4375; // Average days in month
      const monthlyCost = monthlyKwh * rate;
      const yearlyKwh = totalDailyKwh * 365;
      const yearlyCost = yearlyKwh * rate;
      
      // Calculate CO2 emissions
      const yearlyCO2 = yearlyKwh * co2EmissionFactor;
      
      // Set results
      setCalculationResult({
        dailyUsage: {
          kWh: totalDailyKwh,
          cost: dailyCost
        },
        weeklyUsage: {
          kWh: weeklyKwh,
          cost: weeklyCost
        },
        monthlyUsage: {
          kWh: monthlyKwh,
          cost: monthlyCost
        },
        yearlyUsage: {
          kWh: yearlyKwh,
          cost: yearlyCost
        },
        co2Emissions: {
          yearly: yearlyCO2
        }
      });
      
      toast({
        title: "Calculation Complete",
        description: `Estimated monthly cost: ${formatCurrency(monthlyCost)}`,
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
  
  // Format currency based on selected currency
  const formatCurrency = (amount: number): string => {
    switch (currency) {
      case "USD":
        return `$${amount.toFixed(2)}`;
      case "EUR":
        return `€${amount.toFixed(2)}`;
      case "GBP":
        return `£${amount.toFixed(2)}`;
      default:
        return `${amount.toFixed(2)} ${currency}`;
    }
  };
  
  // Currency options
  const currencyOptions = [
    { id: "USD", name: "US Dollar ($)" },
    { id: "EUR", name: "Euro (€)" },
    { id: "GBP", name: "British Pound (£)" },
    { id: "CAD", name: "Canadian Dollar (C$)" },
    { id: "AUD", name: "Australian Dollar (A$)" },
    { id: "INR", name: "Indian Rupee (₹)" },
    { id: "JPY", name: "Japanese Yen (¥)" },
  ];
  
  // Generate and download PDF report
  const generatePDFReport = () => {
    if (!calculationResult) return;
    
    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const textWidth = pageWidth - (margin * 2);
      
      // Add custom branding
      // Header with logo and title
      doc.setFillColor(20, 20, 30);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Power Usage Report', margin, 15);
      
      // Subtitle with date
      doc.setFontSize(10);
      doc.setTextColor(150, 180, 255);
      doc.text(`Generated on ${new Date().toLocaleDateString()} by Mailo Bedo Power Calculator`, margin, 22);
      
      // Line separator
      doc.setDrawColor(50, 100, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);
      
      // Summary section
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Power Consumption Summary', margin, 45);
      
      // Monthly cost highlight
      doc.setFillColor(230, 240, 255);
      doc.rect(margin, 50, textWidth, 20, 'F');
      
      doc.setTextColor(50, 100, 180);
      doc.setFontSize(12);
      doc.text('Monthly Electricity Cost:', margin + 2, 58);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(calculationResult.monthlyUsage.cost), pageWidth - margin - 30, 58);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`(${calculationResult.monthlyUsage.kWh.toFixed(2)} kWh)`, pageWidth - margin - 30, 65);
      
      // Consumption table
      const tableY = 80;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Period', margin, tableY);
      doc.text('Energy (kWh)', margin + 50, tableY);
      doc.text('Cost', margin + 100, tableY);
      
      // Line under header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, tableY + 2, pageWidth - margin, tableY + 2);
      
      // Table content
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      
      // Daily row
      doc.text('Daily', margin, tableY + 10);
      doc.text(calculationResult.dailyUsage.kWh.toFixed(2), margin + 50, tableY + 10);
      doc.text(formatCurrency(calculationResult.dailyUsage.cost), margin + 100, tableY + 10);
      
      // Weekly row
      doc.text('Weekly', margin, tableY + 18);
      doc.text(calculationResult.weeklyUsage.kWh.toFixed(2), margin + 50, tableY + 18);
      doc.text(formatCurrency(calculationResult.weeklyUsage.cost), margin + 100, tableY + 18);
      
      // Monthly row
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly', margin, tableY + 26);
      doc.text(calculationResult.monthlyUsage.kWh.toFixed(2), margin + 50, tableY + 26);
      doc.text(formatCurrency(calculationResult.monthlyUsage.cost), margin + 100, tableY + 26);
      
      // Yearly row
      doc.setFont('helvetica', 'normal');
      doc.text('Yearly', margin, tableY + 34);
      doc.text(calculationResult.yearlyUsage.kWh.toFixed(2), margin + 50, tableY + 34);
      doc.text(formatCurrency(calculationResult.yearlyUsage.cost), margin + 100, tableY + 34);
      
      // Line under table
      doc.line(margin, tableY + 38, pageWidth - margin, tableY + 38);
      
      // Environmental impact
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Environmental Impact', margin, tableY + 48);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text(`CO₂ Emissions (yearly): ${calculationResult.co2Emissions.yearly.toFixed(2)} kg CO₂`, margin, tableY + 56);
      doc.text(`Equivalent to approximately ${(calculationResult.co2Emissions.yearly / 120).toFixed(1)} trees needed for offset`, margin, tableY + 64);
      
      // Devices section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('Your Devices', margin, tableY + 80);
      
      // Devices table
      let deviceTableY = tableY + 90;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Device', margin, deviceTableY);
      doc.text('Power (W)', margin + 60, deviceTableY);
      doc.text('Hours/Day', margin + 85, deviceTableY);
      doc.text('Days/Week', margin + 110, deviceTableY);
      doc.text('Qty', margin + 135, deviceTableY);
      doc.text('kWh/Month', margin + 150, deviceTableY);
      
      // Line under header
      doc.line(margin, deviceTableY + 2, pageWidth - margin, deviceTableY + 2);
      
      // List all devices
      doc.setFont('helvetica', 'normal');
      
      devices.forEach((device, index) => {
        const y = deviceTableY + 8 + (index * 7);
        
        // Calculate device monthly kWh
        const dailyActiveHours = device.hoursPerDay;
        const dailyKwh = (device.powerWatts * dailyActiveHours * device.quantity) / 1000;
        
        // Add standby power if enabled
        let standbyKwh = 0;
        if (includeStandby && device.standbyWatts && device.standbyWatts > 0) {
          const dailyStandbyHours = 24 - dailyActiveHours;
          standbyKwh = (device.standbyWatts * dailyStandbyHours * device.quantity) / 1000;
        }
        
        // Calculate total kWh for this device
        const deviceDailyKwh = dailyKwh + standbyKwh;
        const daysRatio = device.daysPerWeek / 7;
        const monthlyKwh = deviceDailyKwh * daysRatio * 30.4375;
        
        // Truncate device name if too long
        const deviceName = device.name.length > 30 ? device.name.substring(0, 27) + '...' : device.name;
        
        doc.text(deviceName, margin, y);
        doc.text(device.powerWatts.toString(), margin + 60, y);
        doc.text(device.hoursPerDay.toString(), margin + 85, y);
        doc.text(device.daysPerWeek.toString(), margin + 110, y);
        doc.text(device.quantity.toString(), margin + 135, y);
        doc.text(monthlyKwh.toFixed(2), margin + 150, y);
        
        // Add standby info if relevant
        if (includeStandby && device.standbyWatts && device.standbyWatts > 0) {
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`(+ ${device.standbyWatts}W standby)`, margin + 60, y + 3);
          doc.setFontSize(10);
          doc.setTextColor(70, 70, 70);
        }
      });
      
      // Add energy saving tips
      const tipsY = deviceTableY + 10 + (devices.length * 7) + 10;
      
      // Add a new page if tips would go off the page
      if (tipsY > 270) {
        doc.addPage();
        deviceTableY = 20;
      }
      
      doc.setFillColor(235, 245, 255);
      doc.rect(margin, tipsY, textWidth, 30, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 100, 180);
      doc.text('Energy Saving Tips', margin + 2, tipsY + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.text('• Unplug devices when not in use to eliminate standby power consumption', margin + 5, tipsY + 16);
      doc.text('• Replace old appliances with energy-efficient models with lower wattage', margin + 5, tipsY + 22);
      doc.text('• Use smart power strips to automatically cut power to devices in standby mode', margin + 5, tipsY + 28);
      
      // Add footer
      const footerY = 285;
      doc.setDrawColor(50, 100, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Mailo Bedo Power Calculator | mailobedo.nl', margin, footerY + 5);
      doc.text(new Date().toLocaleString(), pageWidth - margin - 40, footerY + 5, { align: 'right' });
      
      // Save the PDF
      const filename = `Power-Usage-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast({
        title: "PDF Generated Successfully",
        description: `Your report has been saved as ${filename}`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF Generation Error",
        description: error instanceof Error ? error.message : "An error occurred generating the PDF",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <VideoBackground opacity={0.10} />
      
      <main className="flex-grow z-10 relative">
        <section className="py-20 px-6">
          <Container maxWidth="xl">
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
                Power Usage Calculator
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Calculate electricity usage, cost, and environmental impact for all your devices
              </p>
            </motion.div>
            
            {/* Mobile-specific layout for smaller screens */}
            <div className="block md:hidden mb-6">
              <Tabs 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                className="mb-4"
              >
                <TabsList className="flex overflow-x-auto whitespace-nowrap w-full bg-gray-800 p-1 max-w-full no-scrollbar">
                  {categories.map(category => (
                    <TabsTrigger 
                      key={category} 
                      value={category}
                      className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white py-1 px-3 flex-shrink-0"
                    >
                      {category.split(" ")[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {categories.map(category => (
                  <TabsContent key={category} value={category} className="mt-2">
                    <div className="grid grid-cols-2 gap-2">
                      {devicePresetsByCategory[category].slice(0, 6).map(preset => (
                        <div 
                          key={preset.name}
                          className="flex flex-col justify-between p-3 bg-gray-800 rounded-lg active:bg-gray-700 cursor-pointer"
                          onClick={() => addPresetDevice(preset)}
                        >
                          <div className="font-medium text-sm line-clamp-1">{preset.name}</div>
                          <div className="text-xs text-blue-400 mt-1">{preset.powerWatts}W</div>
                        </div>
                      ))}
                      <div 
                        className="flex items-center justify-center p-3 bg-blue-600 rounded-lg cursor-pointer text-white text-sm font-medium"
                        onClick={() => document.getElementById('mobileCategoryDrawer')?.scrollIntoView({behavior: 'smooth'})}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        More
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                onClick={() => addDevice()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Custom Device
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sidebar: Device Presets - Hidden on mobile, visible on desktop */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hidden md:block md:col-span-1"
              >
                <Card className="bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10 h-full">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <BadgePlus className="h-5 w-5 text-blue-400" />
                      Add Devices
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Choose from common device presets
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {/* Category Tabs */}
                    <Tabs 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                      className="mb-4"
                    >
                      <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 w-full bg-gray-800 p-1">
                        {categories.map(category => (
                          <TabsTrigger 
                            key={category} 
                            value={category}
                            className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white py-1"
                          >
                            {category.split(" ")[0]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {categories.map(category => (
                        <TabsContent key={category} value={category} className="mt-4 space-y-2">
                          {devicePresetsByCategory[category].map(preset => (
                            <div 
                              key={preset.name}
                              className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors group"
                              onClick={() => addPresetDevice(preset)}
                            >
                              <div>
                                <div className="font-medium text-sm">{preset.name}</div>
                                <div className="text-xs text-blue-400">{preset.powerWatts} Watts</div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <PlusCircle className="h-4 w-4 text-blue-400" />
                              </Button>
                            </div>
                          ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                    
                    <div className="mt-6">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => addDevice()}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Custom Device
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Main Content: Devices & Calculation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card className="bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10 mb-8">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-400" />
                      Settings
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Set electricity rate and other calculation options
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Electricity Rate */}
                      <div className="space-y-2">
                        <Label htmlFor="electricity-rate" className="text-gray-300 flex items-center text-sm">
                          <Zap className="h-4 w-4 mr-2 text-blue-400" />
                          Electricity Rate
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <div className="relative flex-grow">
                            <Input
                              id="electricity-rate"
                              type="number"
                              inputMode="decimal"
                              value={electricityRate}
                              onChange={(e) => setElectricityRate(e.target.value)}
                              className="bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white pr-16 h-9 text-sm"
                              step="0.01"
                              min="0.01"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-xs">
                              per kWh
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-28">
                            <Select
                              value={currency}
                              onValueChange={setCurrency}
                            >
                              <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-blue-500 h-9 text-sm">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                {currencyOptions.map(option => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          The cost of electricity in your area per kilowatt-hour
                        </p>
                      </div>
                      
                      {/* CO2 Emissions */}
                      <div className="space-y-2">
                        <Label htmlFor="co2-factor" className="text-gray-300 flex items-center text-sm">
                          <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                          CO₂ Emission Factor
                        </Label>
                        <div className="relative">
                          <Input
                            id="co2-factor"
                            type="number"
                            inputMode="decimal"
                            value={co2PerKwh}
                            onChange={(e) => setCo2PerKwh(e.target.value)}
                            className="bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500 text-white pr-16 h-9 text-sm"
                            step="0.01"
                            min="0"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-xs">
                            kg/kWh
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          CO₂ emissions per kWh in your region (avg. 0.5 kg CO₂/kWh)
                        </p>
                      </div>
                    </div>
                    
                    {/* Include Standby Power */}
                    <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded-md">
                      <Switch 
                        id="standby-power" 
                        checked={includeStandby}
                        onCheckedChange={setIncludeStandby}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="standby-power" className="text-gray-300 text-sm">
                        Include standby power consumption
                      </Label>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10 mb-8">
                  <CardHeader className="border-b border-gray-800 pb-4">
                    <CardTitle className="text-xl text-white flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-400" />
                      Your Devices
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Add and configure your electrical devices
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    {devices.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No devices added yet. Add devices from the presets or create a custom device.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {devices.map((device) => (
                          <div 
                            key={device.id} 
                            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="w-full">
                                <Input
                                  value={device.name}
                                  onChange={(e) => updateDevice(device.id, 'name', e.target.value)}
                                  className="bg-gray-800 border-gray-700 font-medium text-white mb-2"
                                  placeholder="Device name"
                                />
                                
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                  {/* Power Rating */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-400 flex items-center">
                                      <Zap className="h-3 w-3 mr-1 text-blue-400" />
                                      Power (Watts)
                                    </Label>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={device.powerWatts}
                                      onChange={(e) => updateDevice(device.id, 'powerWatts', e.target.value)}
                                      className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                                      min="0"
                                      step="1"
                                    />
                                  </div>
                                  
                                  {/* Hours per Day */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-400 flex items-center">
                                      <Clock className="h-3 w-3 mr-1 text-blue-400" />
                                      Hours/Day
                                    </Label>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={device.hoursPerDay}
                                      onChange={(e) => updateDevice(device.id, 'hoursPerDay', e.target.value)}
                                      className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                                      min="0"
                                      max="24"
                                      step="0.5"
                                    />
                                  </div>
                                  
                                  {/* Days per Week */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-400 flex items-center">
                                      <Calendar className="h-3 w-3 mr-1 text-blue-400" />
                                      Days/Week
                                    </Label>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={device.daysPerWeek}
                                      onChange={(e) => updateDevice(device.id, 'daysPerWeek', e.target.value)}
                                      className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                                      min="0"
                                      max="7"
                                      step="1"
                                    />
                                  </div>
                                  
                                  {/* Quantity */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-400 flex items-center">
                                      <Layers className="h-3 w-3 mr-1 text-blue-400" />
                                      Quantity
                                    </Label>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={device.quantity}
                                      onChange={(e) => updateDevice(device.id, 'quantity', e.target.value)}
                                      className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                                      min="1"
                                      step="1"
                                    />
                                  </div>
                                </div>
                                
                                {includeStandby && (
                                  <div className="mt-3">
                                    <Label className="text-xs text-gray-400">Standby Power (Watts)</Label>
                                    <div className="mt-1">
                                      <Slider
                                        value={[device.standbyWatts || 0]}
                                        onValueChange={(value) => updateDevice(device.id, 'standbyWatts', value[0])}
                                        min={0}
                                        max={50}
                                        step={0.5}
                                        className="py-2"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        {device.standbyWatts || 0} watts when in standby mode
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeDevice(device.id)}
                                className="text-gray-400 hover:text-red-400 hover:bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="text-xs text-gray-500 mt-1">
                              Daily power: {((device.powerWatts * device.hoursPerDay * device.quantity) / 1000).toFixed(2)} kWh
                              {includeStandby && device.standbyWatts && device.standbyWatts > 0 && (
                                <> + {(((device.standbyWatts) * (24 - device.hoursPerDay) * device.quantity) / 1000).toFixed(2)} kWh standby</>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <Button 
                        onClick={calculatePowerUsage}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={devices.length === 0}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Power Usage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Results Section */}
                {calculationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-gray-900 border-gray-800 shadow-lg shadow-blue-900/10">
                      <CardHeader className="border-b border-gray-800 pb-4">
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-400" />
                          Calculation Results
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Estimated power consumption and costs
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pt-6">
                        {/* Monthly Highlight for Mobile */}
                        <div className="md:hidden mb-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg border border-blue-600/20 p-4">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-300 mb-1">Estimated Monthly Cost</div>
                            <div className="text-3xl font-bold text-white">
                              {formatCurrency(calculationResult.monthlyUsage.cost)}
                            </div>
                            <div className="text-xs text-blue-400 mt-1 font-medium">
                              {calculationResult.monthlyUsage.kWh.toFixed(2)} kWh
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* Daily */}
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-xs font-medium text-gray-400 mb-1">Daily</div>
                            <div className="font-semibold text-white text-sm">
                              {calculationResult.dailyUsage.kWh.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-blue-400 font-medium">
                              {formatCurrency(calculationResult.dailyUsage.cost)}
                            </div>
                          </div>
                          
                          {/* Weekly */}
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-xs font-medium text-gray-400 mb-1">Weekly</div>
                            <div className="font-semibold text-white text-sm">
                              {calculationResult.weeklyUsage.kWh.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-blue-400 font-medium">
                              {formatCurrency(calculationResult.weeklyUsage.cost)}
                            </div>
                          </div>
                          
                          {/* Monthly - Hidden on mobile (shown above) */}
                          <div className="hidden md:block bg-gray-800 p-3 rounded-lg border-2 border-blue-600/20">
                            <div className="text-xs font-medium text-gray-400 mb-1">Monthly</div>
                            <div className="font-semibold text-white text-base">
                              {calculationResult.monthlyUsage.kWh.toFixed(2)} kWh
                            </div>
                            <div className="text-blue-400 font-bold">
                              {formatCurrency(calculationResult.monthlyUsage.cost)}
                            </div>
                          </div>
                          
                          {/* Yearly */}
                          <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="text-xs font-medium text-gray-400 mb-1">Yearly</div>
                            <div className="font-semibold text-white text-sm">
                              {calculationResult.yearlyUsage.kWh.toFixed(2)} kWh
                            </div>
                            <div className="text-xs text-blue-400 font-medium">
                              {formatCurrency(calculationResult.yearlyUsage.cost)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Environmental Impact */}
                        <div className="mt-5 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <h4 className="font-medium mb-2 text-white flex items-center text-sm">
                            <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                            Environmental Impact
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-gray-800 p-3 rounded-lg">
                              <div className="text-xs font-medium text-gray-400 mb-1">CO₂ Emissions (Yearly)</div>
                              <div className="font-semibold text-white text-sm">
                                {calculationResult.co2Emissions.yearly.toFixed(2)} kg CO₂
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ≈ {(calculationResult.co2Emissions.yearly / 120).toFixed(1)} trees needed to offset
                              </div>
                            </div>
                            
                            <div className="bg-gray-800 p-3 rounded-lg">
                              <div className="text-xs font-medium text-gray-400 mb-1">Energy Consumption</div>
                              <div className="font-semibold text-white text-sm">
                                {(calculationResult.monthlyUsage.kWh / (devices.length || 1)).toFixed(2)} kWh/device/month
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Average consumption per device
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Saving Tips */}
                        <div className="mt-5 bg-blue-600/10 rounded-lg p-4 border border-blue-600/20">
                          <h4 className="font-medium mb-2 text-white flex items-center text-sm">
                            <Lightbulb className="h-4 w-4 mr-2 text-blue-400" />
                            Energy Saving Tips
                          </h4>
                          <ul className="text-xs sm:text-sm text-gray-300 space-y-1">
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2 mt-0.5">•</span>
                              <span>Unplug devices when not in use to eliminate standby power</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2 mt-0.5">•</span>
                              <span>Replace old appliances with energy-efficient models</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2 mt-0.5">•</span>
                              <span>Use smart power strips to cut power to devices in standby mode</span>
                            </li>
                          </ul>
                        </div>
                        
                        {/* Save Results Button */}
                        <div className="mt-5">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
                            onClick={generatePDFReport}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Download PDF Report
                          </Button>
                        </div>
                        
                        {/* Mobile-specific full preset listing */}
                        <div id="mobileCategoryDrawer" className="mt-8 md:hidden">
                          <Tabs 
                            value={selectedCategory} 
                            onValueChange={setSelectedCategory}
                            className="mt-0"
                          >
                            <TabsList className="flex overflow-x-auto whitespace-nowrap w-full bg-gray-800 p-1 max-w-full no-scrollbar">
                              {categories.map(category => (
                                <TabsTrigger 
                                  key={category} 
                                  value={category}
                                  className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white py-1 px-3 flex-shrink-0"
                                >
                                  {category.split(" ")[0]}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            
                            {categories.map(category => (
                              <TabsContent key={category} value={category} className="mt-2">
                                <div className="grid grid-cols-1 gap-2">
                                  {devicePresetsByCategory[category].map(preset => (
                                    <div 
                                      key={preset.name}
                                      className="flex justify-between items-center p-3 bg-gray-800 rounded-lg active:bg-gray-700 cursor-pointer"
                                      onClick={() => addPresetDevice(preset)}
                                    >
                                      <div>
                                        <div className="font-medium text-sm">{preset.name}</div>
                                        <div className="text-xs text-blue-400">{preset.powerWatts} Watts</div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="text-blue-400"
                                      >
                                        <PlusCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            ))}
                          </Tabs>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}