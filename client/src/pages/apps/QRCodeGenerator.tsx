import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Link as LinkIcon,
  Mail,
  FileText,
  Phone,
  MessageSquare,
  Smartphone,
  Calendar,
  FileType,
  Image,
  Video,
  Share2,
  Wifi,
  CreditCard,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Cog,
  Loader2,
  Settings2,
  BadgeInfo,
  Palette,
  XCircle,
} from "lucide-react";

// Define QR code types
const qrTypes = [
  { id: "url", name: "Link", icon: <LinkIcon className="h-6 w-6" /> },
  { id: "email", name: "E-mail", icon: <Mail className="h-6 w-6" /> },
  { id: "text", name: "Text", icon: <FileText className="h-6 w-6" /> },
  { id: "tel", name: "Call", icon: <Phone className="h-6 w-6" /> },
  { id: "sms", name: "SMS", icon: <MessageSquare className="h-6 w-6" /> },
  { id: "vcard", name: "V-card", icon: <Smartphone className="h-6 w-6" /> },
  { id: "whatsapp", name: "Whatsapp", icon: <MessageSquare className="h-6 w-6" /> },
  { id: "wifi", name: "WI-FI", icon: <Wifi className="h-6 w-6" /> },
  { id: "paypal", name: "PayPal", icon: <CreditCard className="h-6 w-6" /> },
  { id: "event", name: "Event", icon: <Calendar className="h-6 w-6" /> },
  { id: "pdf", name: "PDF", icon: <FileType className="h-6 w-6" /> },
  { id: "app", name: "App", icon: <Smartphone className="h-6 w-6" /> },
  { id: "image", name: "Images", icon: <Image className="h-6 w-6" /> },
  { id: "video", name: "Video", icon: <Video className="h-6 w-6" /> },
  { id: "social", name: "Social Media", icon: <Share2 className="h-6 w-6" /> },
];

// Form schemas for different QR code types
const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL including http:// or https://"),
});

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  body: z.string().optional(),
});

const textSchema = z.object({
  text: z.string().min(1, "Please enter some text"),
});

const phoneSchema = z.object({
  phone: z.string().min(5, "Please enter a valid phone number"),
});

const smsSchema = z.object({
  phone: z.string().min(5, "Please enter a valid phone number"),
  message: z.string().optional(),
});

const whatsappSchema = z.object({
  phone: z.string().min(5, "Please enter a valid phone number"),
  message: z.string().optional(),
});

const vcardSchema = z.object({
  name: z.string().min(1, "Please enter a name"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  company: z.string().optional(),
  url: z.string().url("Please enter a valid URL including http:// or https://").optional(),
});

const wifiSchema = z.object({
  ssid: z.string().min(1, "Please enter a network name"),
  password: z.string().optional(),
  encryption: z.enum(["WPA", "WEP", "none"]).default("WPA"),
  hidden: z.boolean().default(false),
});

export default function QRCodeGenerator() {
  const [qrType, setQRType] = useState("url");
  const [qrCodeImage, setQRCodeImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [qrOptions, setQROptions] = useState({
    margin: 4,
    errorCorrectionLevel: "M",
    color: "#000000",
    backgroundColor: "#FFFFFF",
    size: 300,
  });
  
  const { toast } = useToast();

  // Reset form and QR code when type changes
  useEffect(() => {
    setQRCodeImage(null);
    setErrorMessage("");
  }, [qrType]);

  // Function to generate QR code based on selected type and form data
  const generateQRCode = async (data: any) => {
    setIsGenerating(true);
    setErrorMessage("");
    
    try {
      let content;
      
      // Format content based on the selected QR type
      switch (qrType) {
        case "url":
          content = data.url;
          break;
        case "email":
          content = {
            email: data.email,
            subject: data.subject,
            body: data.body
          };
          break;
        case "text":
          content = data.text;
          break;
        case "tel":
          content = data.phone;
          break;
        case "sms":
          content = {
            phone: data.phone,
            message: data.message
          };
          break;
        case "whatsapp":
          content = {
            phone: data.phone,
            message: data.message
          };
          break;
        case "vcard":
          content = {
            name: data.name,
            phone: data.phone,
            email: data.email,
            company: data.company,
            url: data.url
          };
          break;
        case "wifi":
          content = {
            ssid: data.ssid,
            password: data.password,
            encryption: data.encryption,
            hidden: data.hidden
          };
          break;
        default:
          content = data;
      }

      // Call the API to generate QR code
      const response = await fetch("/api/generate-qrcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          type: qrType,
          options: {
            margin: qrOptions.margin,
            errorCorrectionLevel: qrOptions.errorCorrectionLevel,
            color: {
              dark: qrOptions.color,
              light: qrOptions.backgroundColor
            },
            width: qrOptions.size
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate QR code");
      }
      
      const result = await response.json();
      setQRCodeImage(result.qrcode);
      
      toast({
        title: "QR Code Generated",
        description: "Your QR code has been successfully created",
      });
    } catch (error: any) {
      console.error("QR code generation error:", error);
      setErrorMessage(error.message || "Failed to generate QR code");
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Download QR code image
  const downloadQRCode = () => {
    if (!qrCodeImage) return;
    
    const link = document.createElement("a");
    link.href = qrCodeImage;
    link.download = `qrcode-${qrType}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been downloaded",
    });
  };

  // Get the appropriate form based on selected QR type
  const renderForm = () => {
    switch (qrType) {
      case "url":
        return <URLForm onSubmit={generateQRCode} />;
      case "email":
        return <EmailForm onSubmit={generateQRCode} />;
      case "text":
        return <TextForm onSubmit={generateQRCode} />;
      case "tel":
        return <PhoneForm onSubmit={generateQRCode} />;
      case "sms":
        return <SMSForm onSubmit={generateQRCode} />;
      case "vcard":
        return <VCardForm onSubmit={generateQRCode} />;
      case "whatsapp":
        return <WhatsAppForm onSubmit={generateQRCode} />;
      case "wifi":
        return <WiFiForm onSubmit={generateQRCode} />;
      default:
        return (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">This QR code type is coming soon!</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => setQRType("url")}
            >
              Switch to URL QR code
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="lg">
            <div className="mb-8">
              <Link to="/apps" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </Link>
            </div>
            
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                QR Code Generator
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create customizable QR codes for websites, contact details, WiFi networks, and more
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
              {/* QR Code Type Selection */}
              <motion.div 
                className="lg:col-span-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-md h-full">
                  <CardHeader>
                    <CardTitle>Select QR Code Type</CardTitle>
                    <CardDescription>
                      Choose the type of content for your QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                      {qrTypes.map((type) => (
                        <button
                          key={type.id}
                          className={`aspect-square flex flex-col items-center justify-center rounded-lg p-4 transition-colors 
                                    ${qrType === type.id 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted/50 hover:bg-muted text-foreground'}`}
                          onClick={() => setQRType(type.id)}
                        >
                          {type.icon}
                          <span className="mt-2 text-xs font-medium">{type.name}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Form for the selected QR type */}
                    <div className="mt-8">
                      {renderForm()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* QR Code Result and Options */}
              <motion.div 
                className="lg:col-span-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-md mb-6">
                  <CardHeader>
                    <CardTitle>QR Code Result</CardTitle>
                    <CardDescription>
                      Your generated QR code will appear here
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pb-8">
                    <div className="bg-white rounded-lg p-4 w-full max-w-xs mx-auto shadow-sm border flex items-center justify-center min-h-[300px]">
                      {isGenerating ? (
                        <div className="flex flex-col items-center justify-center text-center p-6">
                          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                          <p className="text-muted-foreground">Generating QR code...</p>
                        </div>
                      ) : qrCodeImage ? (
                        <img 
                          src={qrCodeImage} 
                          alt="Generated QR Code" 
                          className="max-w-full"
                          style={{ 
                            width: `${qrOptions.size}px`,
                            maxWidth: "100%"
                          }}
                        />
                      ) : errorMessage ? (
                        <div className="flex flex-col items-center justify-center text-center p-6">
                          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                          <p className="text-destructive font-medium mb-2">Error</p>
                          <p className="text-muted-foreground text-sm">{errorMessage}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6">
                          <QRPlaceholder />
                          <p className="text-muted-foreground mt-4">Fill out the form and generate your QR code</p>
                        </div>
                      )}
                    </div>
                    
                    {qrCodeImage && (
                      <Button
                        className="mt-6 w-full"
                        onClick={downloadQRCode}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* QR Code Options */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings2 className="h-5 w-5 mr-2 text-primary" />
                      Options
                    </CardTitle>
                    <CardDescription>
                      Customize your QR code appearance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible defaultValue="size">
                      <AccordionItem value="size">
                        <AccordionTrigger>Size</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <Label htmlFor="qr-size">QR Code Size: {qrOptions.size}px</Label>
                              </div>
                              <Slider
                                id="qr-size"
                                min={100}
                                max={1000}
                                step={10}
                                value={[qrOptions.size]}
                                onValueChange={(value) => setQROptions({...qrOptions, size: value[0]})}
                              />
                            </div>
                            <div>
                              <div className="flex justify-between mb-2">
                                <Label htmlFor="qr-margin">Margin: {qrOptions.margin}</Label>
                              </div>
                              <Slider
                                id="qr-margin"
                                min={0}
                                max={10}
                                step={1}
                                value={[qrOptions.margin]}
                                onValueChange={(value) => setQROptions({...qrOptions, margin: value[0]})}
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="color">
                        <AccordionTrigger>Colors</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="qr-color">Foreground Color</Label>
                              <div className="flex mt-2">
                                <Input
                                  id="qr-color"
                                  type="color"
                                  className="w-12 h-10 p-1"
                                  value={qrOptions.color}
                                  onChange={(e) => setQROptions({...qrOptions, color: e.target.value})}
                                />
                                <Input 
                                  className="flex-1 ml-2"
                                  value={qrOptions.color}
                                  onChange={(e) => setQROptions({...qrOptions, color: e.target.value})}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="qr-bg-color">Background Color</Label>
                              <div className="flex mt-2">
                                <Input
                                  id="qr-bg-color"
                                  type="color"
                                  className="w-12 h-10 p-1"
                                  value={qrOptions.backgroundColor}
                                  onChange={(e) => setQROptions({...qrOptions, backgroundColor: e.target.value})}
                                />
                                <Input 
                                  className="flex-1 ml-2"
                                  value={qrOptions.backgroundColor}
                                  onChange={(e) => setQROptions({...qrOptions, backgroundColor: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="quality">
                        <AccordionTrigger>Error Correction</AccordionTrigger>
                        <AccordionContent>
                          <RadioGroup 
                            defaultValue={qrOptions.errorCorrectionLevel}
                            onValueChange={(value) => setQROptions({...qrOptions, errorCorrectionLevel: value})}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="L" id="r1" />
                              <Label htmlFor="r1">Low (7%)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="M" id="r2" />
                              <Label htmlFor="r2">Medium (15%)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Q" id="r3" />
                              <Label htmlFor="r3">Quartile (25%)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="H" id="r4" />
                              <Label htmlFor="r4">High (30%)</Label>
                            </div>
                          </RadioGroup>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Higher correction levels make QR codes more resistant to damage, but also increase complexity.
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// Form components for different QR code types
function URLForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "https://",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormDescription>
                Enter the URL you want to encode in the QR code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function EmailForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      subject: "",
      body: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="example@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Email subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Your email message" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function TextForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(textSchema),
    defaultValues: {
      text: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter any text that you want to encode" 
                  className="min-h-[150px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function PhoneForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormDescription>
                Include the country code for international numbers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function SMSForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      phone: "",
      message: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Your SMS message" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function WhatsAppForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      phone: "",
      message: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormDescription>
                Include the country code without spaces or special characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Pre-filled message for WhatsApp" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function VCardForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(vcardSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      url: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="example@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Company Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

function WiFiForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const form = useForm({
    resolver: zodResolver(wifiSchema),
    defaultValues: {
      ssid: "",
      password: "",
      encryption: "WPA",
      hidden: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ssid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network Name (SSID)</FormLabel>
              <FormControl>
                <Input placeholder="WiFi Network Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password (Optional)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="WiFi Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="encryption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Security Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select security type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hidden"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Hidden Network</FormLabel>
                <FormDescription>
                  Enable if your WiFi network is hidden
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate QR Code"
          )}
        </Button>
      </form>
    </Form>
  );
}

// QR Code placeholder component
function QRPlaceholder() {
  return (
    <div className="w-[200px] h-[200px] border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
      <div className="text-muted-foreground">
        <QRIcon size={80} />
      </div>
    </div>
  );
}

// Simple QR code placeholder icon
function QRIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <rect x="7" y="7" width="3" height="3"></rect>
      <rect x="14" y="7" width="3" height="3"></rect>
      <rect x="7" y="14" width="3" height="3"></rect>
      <rect x="14" y="14" width="3" height="3"></rect>
    </svg>
  );
}