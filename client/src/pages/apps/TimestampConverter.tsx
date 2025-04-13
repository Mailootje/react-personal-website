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
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Copy, 
  Check,
  RefreshCw,
  Clock,
  Calendar,
  ArrowDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Format options
const dateFormatOptions = [
  { id: "iso", name: "ISO 8601 (YYYY-MM-DD)", format: "YYYY-MM-DD" },
  { id: "us", name: "US (MM/DD/YYYY)", format: "MM/DD/YYYY" },
  { id: "eu", name: "European (DD/MM/YYYY)", format: "DD/MM/YYYY" },
  { id: "custom", name: "Custom Format", format: "" }
];

const timeFormatOptions = [
  { id: "24h", name: "24-hour (HH:MM:SS)", format: "HH:MM:SS" },
  { id: "12h", name: "12-hour (hh:mm:ss AM/PM)", format: "hh:mm:ss A" },
  { id: "custom", name: "Custom Format", format: "" }
];

// Timezone options (a subset of common ones)
const timezoneOptions = [
  { id: "local", name: "Local Browser Time", value: "Local" },
  { id: "utc", name: "UTC/GMT", value: "UTC" },
  { id: "est", name: "Eastern Standard Time (EST)", value: "America/New_York" },
  { id: "cst", name: "Central Standard Time (CST)", value: "America/Chicago" },
  { id: "mst", name: "Mountain Standard Time (MST)", value: "America/Denver" },
  { id: "pst", name: "Pacific Standard Time (PST)", value: "America/Los_Angeles" },
  { id: "gmt", name: "Greenwich Mean Time (GMT)", value: "Europe/London" },
  { id: "cet", name: "Central European Time (CET)", value: "Europe/Paris" },
  { id: "ist", name: "India Standard Time (IST)", value: "Asia/Kolkata" },
  { id: "jst", name: "Japan Standard Time (JST)", value: "Asia/Tokyo" },
  { id: "aest", name: "Australian Eastern Standard Time (AEST)", value: "Australia/Sydney" }
];

export default function TimestampConverter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("unix-to-date");
  const [copied, setCopied] = useState<boolean>(false);
  
  // Unix to Date options
  const [unixTimestamp, setUnixTimestamp] = useState<string>("1617235200");
  const [unixUnit, setUnixUnit] = useState<string>("seconds");
  const [unixIncludeTime, setUnixIncludeTime] = useState<boolean>(true);
  const [unixDateFormat, setUnixDateFormat] = useState<string>("iso");
  const [unixTimeFormat, setUnixTimeFormat] = useState<string>("24h");
  const [unixTimezone, setUnixTimezone] = useState<string>("local");
  const [unixCustomFormat, setUnixCustomFormat] = useState<string>("YYYY-MM-DD HH:mm:ss");
  const [dateTimeResult, setDateTimeResult] = useState<string>("");
  
  // Date to Unix options
  const [dateInput, setDateInput] = useState<string>("");
  const [timeInput, setTimeInput] = useState<string>("");
  const [dateToUnixTimezone, setDateToUnixTimezone] = useState<string>("local");
  const [timestampResults, setTimestampResults] = useState<{ unit: string, value: string }[]>([]);
  
  // Initialize with current timestamp on mount
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    setUnixTimestamp(now.toString());
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    
    setDateInput(`${year}-${month}-${day}`);
    setTimeInput(`${hours}:${minutes}`);
    
    // Trigger initial conversions
    handleUnixToDateConversion();
  }, []);

  // Convert unix timestamp to date whenever inputs change
  useEffect(() => {
    if (activeTab === "unix-to-date") {
      handleUnixToDateConversion();
    }
  }, [unixTimestamp, unixUnit, unixDateFormat, unixTimeFormat, unixCustomFormat, unixTimezone, unixIncludeTime]);

  // Convert date to unix timestamp whenever inputs change
  useEffect(() => {
    if (activeTab === "date-to-unix" && dateInput) {
      handleDateToUnixConversion();
    }
  }, [dateInput, timeInput, dateToUnixTimezone]);

  // Handle tab change
  useEffect(() => {
    if (activeTab === "unix-to-date") {
      handleUnixToDateConversion();
    } else {
      handleDateToUnixConversion();
    }
  }, [activeTab]);

  // Format date based on selected format
  const formatDate = (date: Date): string => {
    try {
      if (unixDateFormat === "custom") {
        return formatCustomDate(date, unixCustomFormat);
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
      
      // Base date format
      let formattedDate = "";
      
      switch (unixDateFormat) {
        case "iso":
          formattedDate = `${year}-${month}-${day}`;
          break;
        case "us":
          formattedDate = `${month}/${day}/${year}`;
          break;
        case "eu":
          formattedDate = `${day}/${month}/${year}`;
          break;
        default:
          formattedDate = `${year}-${month}-${day}`;
      }
      
      // Add time if requested
      if (unixIncludeTime) {
        let timeString = "";
        
        switch (unixTimeFormat) {
          case "24h":
            timeString = `${hours}:${minutes}:${seconds}`;
            break;
          case "12h":
            {
              const hour12 = date.getHours() % 12 || 12;
              const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
              timeString = `${String(hour12).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
            }
            break;
          default:
            timeString = `${hours}:${minutes}:${seconds}`;
        }
        
        formattedDate += ` ${timeString}`;
      }
      
      // Add timezone information
      if (unixTimezone !== "local") {
        const tzOffset = date.getTimezoneOffset();
        const tzHours = Math.abs(Math.floor(tzOffset / 60)).toString().padStart(2, '0');
        const tzMinutes = Math.abs(tzOffset % 60).toString().padStart(2, '0');
        const tzSign = tzOffset <= 0 ? '+' : '-';
        
        formattedDate += ` (UTC${tzSign}${tzHours}:${tzMinutes})`;
      }
      
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date format";
    }
  };

  // Custom date formatter (basic implementation)
  const formatCustomDate = (date: Date, format: string): string => {
    try {
      return format
        .replace(/YYYY/g, date.getFullYear().toString())
        .replace(/MM/g, String(date.getMonth() + 1).padStart(2, '0'))
        .replace(/DD/g, String(date.getDate()).padStart(2, '0'))
        .replace(/HH/g, String(date.getHours()).padStart(2, '0'))
        .replace(/hh/g, String(date.getHours() % 12 || 12).padStart(2, '0'))
        .replace(/mm/g, String(date.getMinutes()).padStart(2, '0'))
        .replace(/ss/g, String(date.getSeconds()).padStart(2, '0'))
        .replace(/SSS/g, String(date.getMilliseconds()).padStart(3, '0'))
        .replace(/A/g, date.getHours() >= 12 ? 'PM' : 'AM')
        .replace(/a/g, date.getHours() >= 12 ? 'pm' : 'am');
    } catch (error) {
      console.error("Error with custom format:", error);
      return "Invalid custom format";
    }
  };

  // Convert Unix timestamp to human-readable date
  const handleUnixToDateConversion = () => {
    try {
      if (!unixTimestamp.trim()) {
        setDateTimeResult("");
        return;
      }

      let timestamp = parseInt(unixTimestamp);
      
      if (isNaN(timestamp)) {
        setDateTimeResult("Invalid timestamp");
        return;
      }
      
      // Convert based on unit
      if (unixUnit === "milliseconds") {
        // Already in milliseconds
      } else if (unixUnit === "seconds") {
        timestamp *= 1000; // Convert seconds to milliseconds
      } else if (unixUnit === "microseconds") {
        timestamp /= 1000; // Convert microseconds to milliseconds
      } else if (unixUnit === "nanoseconds") {
        timestamp /= 1000000; // Convert nanoseconds to milliseconds
      }
      
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        setDateTimeResult("Invalid timestamp");
        return;
      }
      
      setDateTimeResult(formatDate(date));
    } catch (error) {
      console.error("Error converting unix timestamp:", error);
      setDateTimeResult("Conversion error");
      toast({
        title: "Conversion Error",
        description: "Failed to convert timestamp",
        variant: "destructive",
      });
    }
  };

  // Convert date to Unix timestamp
  const handleDateToUnixConversion = () => {
    try {
      if (!dateInput) {
        setTimestampResults([]);
        return;
      }
      
      let dateTimeString = dateInput;
      if (timeInput) {
        dateTimeString += `T${timeInput}`;
      } else {
        dateTimeString += "T00:00:00";
      }
      
      const date = new Date(dateTimeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        setTimestampResults([{ unit: "error", value: "Invalid date/time" }]);
        return;
      }
      
      const timestampMs = date.getTime();
      
      setTimestampResults([
        { unit: "Seconds", value: Math.floor(timestampMs / 1000).toString() },
        { unit: "Milliseconds", value: timestampMs.toString() },
        { unit: "Microseconds", value: (timestampMs * 1000).toString() },
        { unit: "Nanoseconds", value: (timestampMs * 1000000).toString() }
      ]);
    } catch (error) {
      console.error("Error converting date to timestamp:", error);
      setTimestampResults([{ unit: "error", value: "Conversion error" }]);
      toast({
        title: "Conversion Error",
        description: "Failed to convert date",
        variant: "destructive",
      });
    }
  };

  // Copy result to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Result copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Get current timestamp for "now" button
  const setCurrentTimestamp = () => {
    const now = Math.floor(Date.now() / 1000);
    setUnixTimestamp(now.toString());
    setUnixUnit("seconds");
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Timestamp Converter</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Convert between Unix timestamps and human-readable dates
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Timestamp Converter</CardTitle>
                  <CardDescription>
                    Convert between different timestamp formats
                  </CardDescription>
                  
                  {/* Conversion Type Tabs */}
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="mt-4"
                  >
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="unix-to-date" className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Unix to Date
                      </TabsTrigger>
                      <TabsTrigger value="date-to-unix" className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date to Unix
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Unix to Date Conversion */}
                  <TabsContent value="unix-to-date" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="unix-timestamp">Unix Timestamp</Label>
                          <div className="flex space-x-2">
                            <Input
                              id="unix-timestamp"
                              type="text"
                              value={unixTimestamp}
                              onChange={(e) => setUnixTimestamp(e.target.value)}
                              className="font-mono"
                            />
                            <Button 
                              variant="outline" 
                              onClick={setCurrentTimestamp}
                              className="whitespace-nowrap"
                            >
                              Now
                            </Button>
                          </div>
                        </div>
                        
                        <div className="w-44 space-y-2">
                          <Label htmlFor="unix-unit">Unit</Label>
                          <Select
                            value={unixUnit}
                            onValueChange={setUnixUnit}
                          >
                            <SelectTrigger id="unix-unit">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seconds">Seconds</SelectItem>
                              <SelectItem value="milliseconds">Milliseconds</SelectItem>
                              <SelectItem value="microseconds">Microseconds</SelectItem>
                              <SelectItem value="nanoseconds">Nanoseconds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date-format">Date Format</Label>
                          <Select
                            value={unixDateFormat}
                            onValueChange={setUnixDateFormat}
                          >
                            <SelectTrigger id="date-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              {dateFormatOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select
                            value={unixTimezone}
                            onValueChange={setUnixTimezone}
                          >
                            <SelectTrigger id="timezone">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              {timezoneOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include-time"
                            checked={unixIncludeTime}
                            onCheckedChange={setUnixIncludeTime}
                          />
                          <Label htmlFor="include-time">Include Time</Label>
                        </div>
                      </div>
                      
                      {unixIncludeTime && (
                        <div className="space-y-2">
                          <Label htmlFor="time-format">Time Format</Label>
                          <Select
                            value={unixTimeFormat}
                            onValueChange={setUnixTimeFormat}
                          >
                            <SelectTrigger id="time-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeFormatOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {(unixDateFormat === "custom" || unixTimeFormat === "custom") && (
                        <div className="space-y-2">
                          <Label htmlFor="custom-format">Custom Format</Label>
                          <Input
                            id="custom-format"
                            type="text"
                            value={unixCustomFormat}
                            onChange={(e) => setUnixCustomFormat(e.target.value)}
                            placeholder="YYYY-MM-DD HH:mm:ss"
                          />
                          <p className="text-xs text-muted-foreground">
                            Format tokens: YYYY (year), MM (month), DD (day), HH (24h), hh (12h), mm (minutes), ss (seconds), A (AM/PM)
                          </p>
                        </div>
                      )}
                      
                      <div className="border rounded-md p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Converted Date:</Label>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(dateTimeResult)}
                            className="h-8 w-8"
                            disabled={!dateTimeResult}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="bg-muted p-3 rounded-sm break-all">
                          <p className="font-mono text-sm">
                            {dateTimeResult || "Enter a valid timestamp"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Date to Unix Conversion */}
                  <TabsContent value="date-to-unix" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date-input">Date</Label>
                          <Input
                            id="date-input"
                            type="date"
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="time-input">Time (optional)</Label>
                          <Input
                            id="time-input"
                            type="time"
                            value={timeInput}
                            onChange={(e) => setTimeInput(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date-timezone">Timezone</Label>
                        <Select
                          value={dateToUnixTimezone}
                          onValueChange={setDateToUnixTimezone}
                        >
                          <SelectTrigger id="date-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezoneOptions.map(option => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-center py-4">
                        <ArrowDown className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-3">Unix Timestamps:</h4>
                        <div className="space-y-3">
                          {timestampResults.map((result, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                              <div>
                                <span className="text-sm font-medium">{result.unit}: </span>
                                <span className="font-mono text-sm">{result.value}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => copyToClipboard(result.value)}
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {timestampResults.length === 0 && (
                            <p className="text-sm text-muted-foreground">Enter a valid date to see timestamps</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Informational Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 max-w-3xl mx-auto"
            >
              <h3 className="text-xl font-semibold mb-4">About Unix Timestamps</h3>
              <div className="bg-card rounded-lg p-6 border border-border space-y-4">
                <p className="text-muted-foreground">
                  A Unix timestamp (also known as Epoch time) is the number of seconds that have elapsed since 
                  January 1, 1970 (midnight UTC/GMT), not counting leap seconds.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <h4 className="font-medium mb-2">Common Unix Timestamps</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li><span className="font-mono">0</span> = 1970-01-01 00:00:00 UTC</li>
                      <li><span className="font-mono">1000000000</span> = 2001-09-09 01:46:40 UTC</li>
                      <li><span className="font-mono">1500000000</span> = 2017-07-14 02:40:00 UTC</li>
                      <li><span className="font-mono">1609459200</span> = 2021-01-01 00:00:00 UTC</li>
                      <li><span className="font-mono">1735689600</span> = 2025-01-01 00:00:00 UTC</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Usage</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Commonly used in programming and databases</li>
                      <li>Simple for date arithmetic (add/subtract seconds)</li>
                      <li>Timezone independent (always UTC)</li>
                      <li>Used in APIs, logs, and file metadata</li>
                      <li>Easy storage as integers</li>
                    </ul>
                  </div>
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