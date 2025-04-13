import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Dice1,
  Hash,
  User,
  Calendar,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define generator types and their options
interface GeneratorOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const generatorOptions: GeneratorOption[] = [
  {
    id: "password",
    name: "Password",
    icon: <Hash className="h-5 w-5" />,
    description: "Generate secure random passwords"
  },
  {
    id: "name",
    name: "Name",
    icon: <User className="h-5 w-5" />,
    description: "Generate random person names"
  },
  {
    id: "number",
    name: "Number",
    icon: <Dice1 className="h-5 w-5" />,
    description: "Generate random numbers in a range"
  },
  {
    id: "date",
    name: "Date",
    icon: <Calendar className="h-5 w-5" />,
    description: "Generate random dates in a range"
  },
  {
    id: "card",
    name: "Credit Card",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Generate random credit card numbers (fake)"
  }
];

// Names data for name generator
const firstNames = [
  "James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
  "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
  "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
  "Michelle", "Amanda", "Kimberly", "Melissa", "Stephanie", "Emily", "Rebecca", "Laura", "Helen", "Nancy"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson",
  "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "Hernandez", "King",
  "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker", "Gonzalez", "Nelson", "Carter"
];

// Generate random integer between min and max (inclusive)
const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Credit card types
const cardTypes = [
  { name: "Visa", prefix: "4", length: 16 },
  { name: "Mastercard", prefix: "5", length: 16 },
  { name: "American Express", prefix: "37", length: 15 },
  { name: "Discover", prefix: "6011", length: 16 }
];

export default function RandomGenerator() {
  const { toast } = useToast();
  const [activeGenerator, setActiveGenerator] = useState<string>("password");
  const [result, setResult] = useState<string>("");
  const [multipleResults, setMultipleResults] = useState<string[]>([]);
  const [count, setCount] = useState<number>(1);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Password generator options
  const [passwordLength, setPasswordLength] = useState<number>(12);
  const [useUppercase, setUseUppercase] = useState<boolean>(true);
  const [useLowercase, setUseLowercase] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  
  // Number generator options
  const [minNumber, setMinNumber] = useState<number>(1);
  const [maxNumber, setMaxNumber] = useState<number>(100);
  const [allowDecimals, setAllowDecimals] = useState<boolean>(false);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  
  // Date generator options
  const [startDate, setStartDate] = useState<string>("2000-01-01");
  const [endDate, setEndDate] = useState<string>("2025-12-31");
  const [dateFormat, setDateFormat] = useState<string>("yyyy-mm-dd");
  
  // Credit card generator options
  const [cardType, setCardType] = useState<string>("random");
  
  // Clear results when changing generator type
  useEffect(() => {
    setResult("");
    setMultipleResults([]);
  }, [activeGenerator]);
  
  // Generate random password
  const generatePassword = (): string => {
    if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
      return "Select at least one character type";
    }
    
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let validChars = "";
    if (useUppercase) validChars += uppercase;
    if (useLowercase) validChars += lowercase;
    if (useNumbers) validChars += numbers;
    if (useSymbols) validChars += symbols;
    
    let password = "";
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * validChars.length);
      password += validChars[randomIndex];
    }
    
    return password;
  };
  
  // Generate random name
  const generateName = (): string => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  };
  
  // Generate random number
  const generateNumber = (): string => {
    if (minNumber > maxNumber) {
      return "Min value must be less than max value";
    }
    
    if (allowDecimals) {
      const randomNum = Math.random() * (maxNumber - minNumber) + minNumber;
      return randomNum.toFixed(decimalPlaces);
    } else {
      return getRandomInt(minNumber, maxNumber).toString();
    }
  };
  
  // Generate random date
  const generateDate = (): string => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    if (isNaN(start) || isNaN(end)) {
      return "Invalid date range";
    }
    
    if (start > end) {
      return "Start date must be before end date";
    }
    
    const randomTimestamp = Math.floor(Math.random() * (end - start + 1)) + start;
    const randomDate = new Date(randomTimestamp);
    
    const year = randomDate.getFullYear();
    const month = String(randomDate.getMonth() + 1).padStart(2, '0');
    const day = String(randomDate.getDate()).padStart(2, '0');
    
    switch (dateFormat) {
      case "mm/dd/yyyy":
        return `${month}/${day}/${year}`;
      case "dd/mm/yyyy":
        return `${day}/${month}/${year}`;
      case "yyyy-mm-dd":
        return `${year}-${month}-${day}`;
      default:
        return `${year}-${month}-${day}`;
    }
  };
  
  // Generate credit card number
  const generateCreditCard = (): string => {
    // Select card type
    let selectedType;
    if (cardType === "random") {
      selectedType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    } else {
      selectedType = cardTypes.find(type => type.name.toLowerCase() === cardType.toLowerCase()) 
        || cardTypes[0];
    }
    
    // Generate card number
    let cardNumber = selectedType.prefix;
    const length = selectedType.length - selectedType.prefix.length;
    
    for (let i = 0; i < length - 1; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    
    // Add check digit using Luhn algorithm (simplified implementation)
    let sum = 0;
    for (let i = 0; i < cardNumber.length; i++) {
      let digit = parseInt(cardNumber[cardNumber.length - 1 - i]);
      if (i % 2 === 1) { // Odd positions (from right to left)
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    cardNumber += checkDigit.toString();
    
    // Format the card number
    let formattedNumber = "";
    for (let i = 0; i < cardNumber.length; i++) {
      if (i > 0 && i % 4 === 0) formattedNumber += " ";
      formattedNumber += cardNumber[i];
    }
    
    return `${formattedNumber} (${selectedType.name})`;
  };
  
  // Main generate function
  const generate = () => {
    setGenerating(true);
    
    try {
      // Generate a single result or multiple results based on count
      if (count === 1) {
        switch (activeGenerator) {
          case "password":
            setResult(generatePassword());
            break;
          case "name":
            setResult(generateName());
            break;
          case "number":
            setResult(generateNumber());
            break;
          case "date":
            setResult(generateDate());
            break;
          case "card":
            setResult(generateCreditCard());
            break;
          default:
            setResult("Unknown generator type");
        }
      } else {
        const results: string[] = [];
        for (let i = 0; i < count; i++) {
          switch (activeGenerator) {
            case "password":
              results.push(generatePassword());
              break;
            case "name":
              results.push(generateName());
              break;
            case "number":
              results.push(generateNumber());
              break;
            case "date":
              results.push(generateDate());
              break;
            case "card":
              results.push(generateCreditCard());
              break;
            default:
              results.push("Unknown generator type");
          }
        }
        setMultipleResults(results);
      }
    } catch (error) {
      console.error("Error generating random data:", error);
      toast({
        title: "Error",
        description: "Failed to generate random data",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // Copy result to clipboard
  const copyToClipboard = (text?: string) => {
    const textToCopy = text || result || multipleResults.join("\n");
    
    if (!textToCopy) return;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Result copied to clipboard",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Random Generator</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Generate random passwords, names, numbers, dates and more
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <div className="flex flex-col space-y-2">
                    <CardTitle>Random Generator</CardTitle>
                    <CardDescription>
                      Select a generator type and customize options
                    </CardDescription>
                    
                    {/* Generator Type Tabs */}
                    <Tabs 
                      value={activeGenerator} 
                      onValueChange={setActiveGenerator}
                      className="mt-4"
                    >
                      <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full">
                        {generatorOptions.map(option => (
                          <TabsTrigger 
                            key={option.id} 
                            value={option.id}
                            className="flex items-center justify-center"
                          >
                            <span className="hidden md:inline-flex items-center">
                              <span className="mr-2">{option.icon}</span>
                              {option.name}
                            </span>
                            <span className="md:hidden">{option.icon}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Number of results to generate */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="count">Number of Results</Label>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <Slider
                      id="count"
                      min={1}
                      max={50}
                      step={1}
                      value={[count]}
                      onValueChange={(value) => setCount(value[0])}
                    />
                  </div>
                  
                  {/* Password Generator Options */}
                  {activeGenerator === "password" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="length">Password Length</Label>
                          <span className="text-sm text-muted-foreground">{passwordLength}</span>
                        </div>
                        <Slider
                          id="length"
                          min={4}
                          max={64}
                          step={1}
                          value={[passwordLength]}
                          onValueChange={(value) => setPasswordLength(value[0])}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="uppercase"
                            checked={useUppercase}
                            onCheckedChange={setUseUppercase}
                          />
                          <Label htmlFor="uppercase">Include Uppercase</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="lowercase"
                            checked={useLowercase}
                            onCheckedChange={setUseLowercase}
                          />
                          <Label htmlFor="lowercase">Include Lowercase</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="numbers"
                            checked={useNumbers}
                            onCheckedChange={setUseNumbers}
                          />
                          <Label htmlFor="numbers">Include Numbers</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="symbols"
                            checked={useSymbols}
                            onCheckedChange={setUseSymbols}
                          />
                          <Label htmlFor="symbols">Include Symbols</Label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Number Generator Options */}
                  {activeGenerator === "number" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min">Minimum Value</Label>
                          <Input
                            id="min"
                            type="number"
                            value={minNumber}
                            onChange={(e) => setMinNumber(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="max">Maximum Value</Label>
                          <Input
                            id="max"
                            type="number"
                            value={maxNumber}
                            onChange={(e) => setMaxNumber(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="decimals"
                          checked={allowDecimals}
                          onCheckedChange={setAllowDecimals}
                        />
                        <Label htmlFor="decimals">Allow Decimal Numbers</Label>
                      </div>
                      
                      {allowDecimals && (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="decimal-places">Decimal Places</Label>
                            <span className="text-sm text-muted-foreground">{decimalPlaces}</span>
                          </div>
                          <Slider
                            id="decimal-places"
                            min={0}
                            max={10}
                            step={1}
                            value={[decimalPlaces]}
                            onValueChange={(value) => setDecimalPlaces(value[0])}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Date Generator Options */}
                  {activeGenerator === "date" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="end-date">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date-format">Date Format</Label>
                        <Select
                          value={dateFormat}
                          onValueChange={setDateFormat}
                        >
                          <SelectTrigger id="date-format">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                            <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                            <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {/* Credit Card Generator Options */}
                  {activeGenerator === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="card-type">Card Type</Label>
                        <Select
                          value={cardType}
                          onValueChange={setCardType}
                        >
                          <SelectTrigger id="card-type">
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Random</SelectItem>
                            {cardTypes.map((type, index) => (
                              <SelectItem key={index} value={type.name.toLowerCase()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: These are randomly generated numbers that follow card format rules
                          but are NOT valid for actual purchases. For testing purposes only.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Generate Button */}
                  <Button 
                    onClick={generate}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate {count > 1 ? `${count} Results` : ""}
                      </>
                    )}
                  </Button>
                  
                  {/* Result Display */}
                  {count === 1 && result && (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Result:</Label>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard()}
                          className="h-8 w-8"
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
                          {result}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Multiple Results Display */}
                  {count > 1 && multipleResults.length > 0 && (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Results:</Label>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard()}
                            className="h-8 w-8"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-sm h-48 overflow-y-auto">
                        <pre className="font-mono text-sm whitespace-pre-wrap break-all">
                          {multipleResults.map((item, index) => (
                            <div key={index} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                              <span className="text-muted-foreground mr-2">{index + 1}.</span>
                              <span className="flex-grow">{item}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => copyToClipboard(item)}
                                className="h-6 w-6 opacity-50 hover:opacity-100"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}