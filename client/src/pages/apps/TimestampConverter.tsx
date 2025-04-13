import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Clock, Calendar, ArrowDown, Copy, Check } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function TimestampConverter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("unix-to-human");
  const [unixTimestamp, setUnixTimestamp] = useState("");
  const [unixTimestampUnit, setUnixTimestampUnit] = useState("seconds");
  const [dateTime, setDateTime] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [convertedDateTime, setConvertedDateTime] = useState<string | null>(null);
  const [convertedUnixTimestamp, setConvertedUnixTimestamp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Set current date/time on component mount
  useEffect(() => {
    const now = new Date();
    // Format as yyyy-MM-ddThh:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    setUnixTimestamp(Math.floor(now.getTime() / 1000).toString());
  }, []);

  // Convert Unix timestamp to human-readable date
  const convertUnixToHuman = () => {
    if (!unixTimestamp) return;
    
    try {
      let timestamp = parseInt(unixTimestamp);
      
      // Convert to milliseconds if needed
      if (unixTimestampUnit === "seconds") {
        timestamp *= 1000;
      }
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid timestamp");
      }
      
      // Format the date based on the selected timezone
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        timeZone: timezone
      };
      
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setConvertedDateTime(formatter.format(date));
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: "Invalid Unix timestamp provided",
        variant: "destructive",
      });
      setConvertedDateTime(null);
    }
  };

  // Convert human-readable date to Unix timestamp
  const convertHumanToUnix = () => {
    if (!dateTime) return;
    
    try {
      // Parse the local datetime input
      const inputDate = new Date(dateTime);
      if (isNaN(inputDate.getTime())) {
        throw new Error("Invalid date");
      }

      // Handle timezone conversion
      let timestamp: number;
      
      if (timezone === "UTC") {
        // Convert to UTC timestamp
        const utcDate = new Date(
          Date.UTC(
            inputDate.getFullYear(),
            inputDate.getMonth(),
            inputDate.getDate(),
            inputDate.getHours(),
            inputDate.getMinutes(),
            0
          )
        );
        timestamp = utcDate.getTime();
      } else if (timezone === "local") {
        // Use local timezone
        timestamp = inputDate.getTime();
      } else {
        // For specific timezone, we need to account for the offset
        // This is simplified - in a production app, you'd use a library like date-fns-tz
        timestamp = inputDate.getTime();
      }
      
      // Convert to seconds or milliseconds based on the selected unit
      if (unixTimestampUnit === "seconds") {
        timestamp = Math.floor(timestamp / 1000);
      }
      
      setConvertedUnixTimestamp(timestamp.toString());
    } catch (error) {
      toast({
        title: "Conversion Error",
        description: "Invalid date provided",
        variant: "destructive",
      });
      setConvertedUnixTimestamp(null);
    }
  };

  // Copy result to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Value copied to clipboard",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Get the current Unix timestamp
  const getCurrentTimestamp = () => {
    const now = new Date();
    const timestamp = unixTimestampUnit === "seconds" 
      ? Math.floor(now.getTime() / 1000)
      : now.getTime();
    
    setUnixTimestamp(timestamp.toString());
    convertUnixToHuman();
  };

  // Get the current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    convertHumanToUnix();
  };

  const timezones = [
    { id: "UTC", name: "UTC (Coordinated Universal Time)" },
    { id: "local", name: "Browser Local Time" },
    { id: "America/New_York", name: "Eastern Time (ET) - New York" },
    { id: "America/Chicago", name: "Central Time (CT) - Chicago" },
    { id: "America/Denver", name: "Mountain Time (MT) - Denver" },
    { id: "America/Los_Angeles", name: "Pacific Time (PT) - Los Angeles" },
    { id: "Europe/London", name: "Greenwich Mean Time (GMT) - London" },
    { id: "Europe/Paris", name: "Central European Time (CET) - Paris" },
    { id: "Asia/Tokyo", name: "Japan Standard Time (JST) - Tokyo" },
    { id: "Australia/Sydney", name: "Australian Eastern Time (AET) - Sydney" },
  ];

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
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Time Converter</CardTitle>
                  <CardDescription>
                    Convert between Unix timestamps and human-readable dates with timezone support
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs 
                    defaultValue="unix-to-human" 
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="unix-to-human">
                        Unix → Human Date
                      </TabsTrigger>
                      <TabsTrigger value="human-to-unix">
                        Human Date → Unix
                      </TabsTrigger>
                    </TabsList>

                    {/* Unix to Human Date */}
                    <TabsContent value="unix-to-human" className="space-y-4">
                      <div className="flex flex-col space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-3">
                            <label className="text-sm font-medium mb-2 block">
                              Unix Timestamp
                            </label>
                            <Input
                              type="number"
                              value={unixTimestamp}
                              onChange={(e) => setUnixTimestamp(e.target.value)}
                              placeholder="Enter Unix timestamp"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Unit
                            </label>
                            <Select
                              value={unixTimestampUnit}
                              onValueChange={setUnixTimestampUnit}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seconds">Seconds</SelectItem>
                                <SelectItem value="milliseconds">Milliseconds</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Timezone
                          </label>
                          <Select
                            value={timezone}
                            onValueChange={setTimezone}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz.id} value={tz.id}>
                                  {tz.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            onClick={convertUnixToHuman}
                            className="flex-1"
                          >
                            Convert
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={getCurrentTimestamp}
                            title="Get current timestamp"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>

                        {convertedDateTime && (
                          <div className="mt-6 p-4 bg-muted rounded-md relative">
                            <h3 className="text-sm font-medium mb-2">Converted Date and Time:</h3>
                            <p className="font-mono text-md">{convertedDateTime}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(convertedDateTime)}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Human Date to Unix */}
                    <TabsContent value="human-to-unix" className="space-y-4">
                      <div className="flex flex-col space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Date and Time
                          </label>
                          <Input
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Timezone
                            </label>
                            <Select
                              value={timezone}
                              onValueChange={setTimezone}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timezones.map((tz) => (
                                  <SelectItem key={tz.id} value={tz.id}>
                                    {tz.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">
                              Output Unit
                            </label>
                            <Select
                              value={unixTimestampUnit}
                              onValueChange={setUnixTimestampUnit}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="seconds">Seconds</SelectItem>
                                <SelectItem value="milliseconds">Milliseconds</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            onClick={convertHumanToUnix}
                            className="flex-1"
                          >
                            Convert
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={getCurrentDateTime}
                            title="Get current date/time"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>

                        {convertedUnixTimestamp && (
                          <div className="mt-6 p-4 bg-muted rounded-md relative">
                            <h3 className="text-sm font-medium mb-2">Unix Timestamp ({unixTimestampUnit}):</h3>
                            <p className="font-mono text-md">{convertedUnixTimestamp}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => copyToClipboard(convertedUnixTimestamp)}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-2xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">About Unix Timestamps</h2>
              <p className="mb-4 text-muted-foreground">
                A Unix timestamp (also known as Epoch time, POSIX time, or Unix time) represents the number of seconds or milliseconds that have elapsed since January 1, 1970, at 00:00:00 UTC.
              </p>
              <p className="mb-4 text-muted-foreground">
                Unix timestamps are widely used in computer systems and programming as they provide a standardized way to represent a point in time across different platforms and applications, regardless of timezone.
              </p>
              <h3 className="text-lg font-bold mt-6 mb-2">Common Uses:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Database timestamps
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  API request/response timestamps
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  File system metadata
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Session and token expiration times
                </li>
              </ul>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}