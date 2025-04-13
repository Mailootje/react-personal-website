import React, { useState, useEffect, useRef } from 'react';
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import SectionHeading from "@/components/SectionHeading";
import { 
  Cloud, 
  CloudRain, 
  Droplets, 
  Sun, 
  Wind, 
  ThermometerSun, 
  ThermometerSnowflake,
  Compass,
  Eye,
  Gauge,
  Calendar,
  Search,
  Loader2,
  MapPin,
  Clock as ClockIcon
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues
// We'll use a modified component instead of modifying the default icon
// This avoids TypeScript errors with the Icon.Default prototype
// Use traditional URL approach
const ICON_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const ICON_RETINA_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const SHADOW_URL = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// Create a custom marker component
function CustomMarker({ position, children }: { position: [number, number], children?: React.ReactNode }) {
  const customIcon = new L.Icon({
    iconUrl: ICON_URL,
    iconRetinaUrl: ICON_RETINA_URL,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  return (
    <Marker position={position} icon={customIcon}>
      {children}
    </Marker>
  );
}

// Types for weather data
interface WeatherData {
  current: {
    name: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
      deg: number;
    };
    visibility: number;
    dt: number;
    sys: {
      country: string;
      sunrise: number;
      sunset: number;
    };
    coord: {
      lat: number;
      lon: number;
    };
  };
  forecast: {
    current: {
      dt: number;
      temp: number;
      feels_like: number;
      humidity: number;
      uvi: number;
      wind_speed: number;
    };
    hourly: Array<{
      dt: number;
      temp: number;
      weather: Array<{
        id: number;
        description: string;
        icon: string;
      }>;
    }>;
    daily: Array<{
      dt: number;
      temp: {
        min: number;
        max: number;
        day: number;
      };
      weather: Array<{
        id: number;
        description: string;
        icon: string;
      }>;
      humidity: number;
      wind_speed: number;
      pop: number; // Probability of precipitation
    }>;
  };
}

// Units system
type UnitSystem = 'metric' | 'imperial';
interface UnitDisplay {
  temperature: string;
  wind: string;
  visibilityDivisor: number;
  pressureLabel: string;
}

const unitDisplayMap: Record<UnitSystem, UnitDisplay> = {
  metric: {
    temperature: '°C',
    wind: 'm/s',
    visibilityDivisor: 1000, // m to km
    pressureLabel: 'hPa',
  },
  imperial: {
    temperature: '°F',
    wind: 'mph',
    visibilityDivisor: 1609.34, // m to mi
    pressureLabel: 'hPa',
  },
};

export default function WeatherDashboard() {
  const { toast } = useToast();
  const [location, setLocation] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [savedLocations, setSavedLocations] = useState<string[]>(() => {
    // Load saved locations from local storage
    const saved = localStorage.getItem('weatherLocations');
    return saved ? JSON.parse(saved) : ['Amsterdam', 'London', 'New York'];
  });

  // Weather data query
  const { data, isLoading, isError, error, refetch } = useQuery<WeatherData>({
    queryKey: ['/api/weather', location, units],
    queryFn: () => 
      apiRequest(`/api/weather?location=${encodeURIComponent(location)}&units=${units}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
    enabled: !!location,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize with default location if none saved
  useEffect(() => {
    if (savedLocations.length > 0 && !location) {
      setLocation(savedLocations[0]);
      setSearchLocation(savedLocations[0]);
    }
  }, [savedLocations, location]);

  // Save locations to local storage
  useEffect(() => {
    localStorage.setItem('weatherLocations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchLocation.trim()) {
      setLocation(searchLocation.trim());
    }
  };

  // Save current location
  const saveLocation = () => {
    if (data?.current.name && !savedLocations.includes(data.current.name)) {
      const newLocations = [...savedLocations, data.current.name];
      setSavedLocations(newLocations);
      toast({
        title: 'Location saved',
        description: `${data.current.name} has been added to your saved locations.`,
      });
    }
  };

  // Remove saved location
  const removeLocation = (locationToRemove: string) => {
    const newLocations = savedLocations.filter(loc => loc !== locationToRemove);
    setSavedLocations(newLocations);
    toast({
      title: 'Location removed',
      description: `${locationToRemove} has been removed from your saved locations.`,
    });
  };

  // Load saved location
  const loadSavedLocation = (savedLocation: string) => {
    setSearchLocation(savedLocation);
    setLocation(savedLocation);
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number, options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, options);
  };

  // Format timestamp to time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get appropriate weather icon
  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Format temperature
  const formatTemp = (temp: number) => {
    return `${Math.round(temp)}${unitDisplayMap[units].temperature}`;
  };

  // Get wind direction
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  // Format wind speed
  const formatWindSpeed = (speed: number) => {
    return `${speed.toFixed(1)} ${unitDisplayMap[units].wind}`;
  };

  // Format visibility
  const formatVisibility = (visibility: number) => {
    return `${(visibility / unitDisplayMap[units].visibilityDivisor).toFixed(1)} ${units === 'metric' ? 'km' : 'mi'}`;
  };

  // Get background color based on temperature
  const getTemperatureColor = (temp: number) => {
    if (units === 'metric') {
      if (temp <= 0) return 'bg-blue-100 text-blue-800';
      if (temp <= 10) return 'bg-cyan-100 text-cyan-800';
      if (temp <= 20) return 'bg-green-100 text-green-800';
      if (temp <= 30) return 'bg-yellow-100 text-yellow-800';
      return 'bg-orange-100 text-orange-800';
    } else {
      if (temp <= 32) return 'bg-blue-100 text-blue-800';
      if (temp <= 50) return 'bg-cyan-100 text-cyan-800';
      if (temp <= 68) return 'bg-green-100 text-green-800';
      if (temp <= 86) return 'bg-yellow-100 text-yellow-800';
      return 'bg-orange-100 text-orange-800';
    }
  };

  // Get precipitation icon and color
  const getPrecipitationBadge = (pop: number) => {
    if (pop < 0.2) return null;
    
    let color = 'bg-blue-100 text-blue-800';
    if (pop >= 0.7) color = 'bg-blue-800 text-white';
    else if (pop >= 0.4) color = 'bg-blue-500 text-white';
    
    return (
      <Badge className={color}>
        <Droplets className="w-3 h-3 mr-1" />
        {Math.round(pop * 100)}%
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <Container>
          <SectionHeading
            subtitle="Check current conditions & forecast"
            title="Weather Dashboard"
            center
            className="mt-8 mb-10"
          />
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* Search & Settings Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle>Search Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="flex flex-col space-y-2">
                    <div className="flex">
                      <Input
                        placeholder="City name"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        className="flex-1 rounded-r-none"
                      />
                      <Button 
                        type="submit" 
                        variant="default" 
                        className="rounded-l-none"
                        disabled={isLoading || !searchLocation.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
                
                <CardHeader className="py-2">
                  <CardTitle>Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex">
                    <Button
                      variant={units === 'metric' ? 'default' : 'outline'}
                      className="flex-1 rounded-r-none"
                      onClick={() => setUnits('metric')}
                    >
                      Celsius
                    </Button>
                    <Button
                      variant={units === 'imperial' ? 'default' : 'outline'}
                      className="flex-1 rounded-l-none"
                      onClick={() => setUnits('imperial')}
                    >
                      Fahrenheit
                    </Button>
                  </div>
                </CardContent>
                
                <CardHeader className="py-2">
                  <CardTitle>Saved Locations</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {data?.current && (
                    <Button 
                      variant="outline" 
                      className="w-full mb-2" 
                      onClick={saveLocation}
                      disabled={savedLocations.includes(data.current.name)}
                    >
                      {savedLocations.includes(data.current.name) 
                        ? `${data.current.name} already saved` 
                        : `Save ${data.current.name}`}
                    </Button>
                  )}
                  
                  <div className="flex flex-col space-y-2 mt-1">
                    {savedLocations.map((loc) => (
                      <div key={loc} className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          className="text-left px-2 py-1 h-auto"
                          onClick={() => loadSavedLocation(loc)}
                        >
                          {loc}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => removeLocation(loc)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    
                    {savedLocations.length === 0 && (
                      <p className="text-sm text-muted-foreground">No saved locations</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="md:col-span-3">
              {isError && (
                <Card className="bg-red-50 mb-4 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-red-800">Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-700">
                      {(error as any)?.message || 'Failed to fetch weather data. Please try again.'}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => refetch()} variant="outline">Try Again</Button>
                  </CardFooter>
                </Card>
              )}
              
              {isLoading && (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {data && !isLoading && !isError && (
                <>
                  {/* Current Weather Card */}
                  <Card className="shadow-md overflow-hidden mb-6">
                    <div className="relative">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center mb-4 md:mb-0">
                            <div className="mr-4">
                              <img 
                                src={getWeatherIcon(data.current.weather[0].icon)} 
                                alt={data.current.weather[0].description}
                                className="w-16 h-16"
                              />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">
                                {data.current.name}, {data.current.sys.country}
                              </h2>
                              <p className="text-lg font-medium capitalize">
                                {data.current.weather[0].description}
                              </p>
                              <p className="text-sm">
                                {formatDate(data.current.dt, { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-5xl font-bold">
                              {formatTemp(data.current.main.temp)}
                            </div>
                            <p className="text-lg">
                              Feels like {formatTemp(data.current.main.feels_like)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          <div className="flex items-center">
                            <ThermometerSun className="mr-2 h-5 w-5" />
                            <div>
                              <p className="text-sm">High</p>
                              <p className="font-medium">{formatTemp(data.current.main.temp_max)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <ThermometerSnowflake className="mr-2 h-5 w-5" />
                            <div>
                              <p className="text-sm">Low</p>
                              <p className="font-medium">{formatTemp(data.current.main.temp_min)}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Wind className="mr-2 h-5 w-5" />
                            <div>
                              <p className="text-sm">Wind</p>
                              <p className="font-medium">
                                {formatWindSpeed(data.current.wind.speed)} {getWindDirection(data.current.wind.deg)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Droplets className="mr-2 h-5 w-5" />
                            <div>
                              <p className="text-sm">Humidity</p>
                              <p className="font-medium">{data.current.main.humidity}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-slate-500 mb-1">
                            <Eye className="mx-auto h-5 w-5" />
                          </div>
                          <span className="text-sm text-slate-500">Visibility</span>
                          <span className="font-medium">
                            {formatVisibility(data.current.visibility)}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-slate-500 mb-1">
                            <Gauge className="mx-auto h-5 w-5" />
                          </div>
                          <span className="text-sm text-slate-500">Pressure</span>
                          <span className="font-medium">
                            {data.current.main.pressure} {unitDisplayMap[units].pressureLabel}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-slate-500 mb-1">
                            <Sun className="mx-auto h-5 w-5" />
                          </div>
                          <span className="text-sm text-slate-500">Sunrise</span>
                          <span className="font-medium">
                            {formatTime(data.current.sys.sunrise)}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-slate-500 mb-1">
                            <Cloud className="mx-auto h-5 w-5" />
                          </div>
                          <span className="text-sm text-slate-500">Sunset</span>
                          <span className="font-medium">
                            {formatTime(data.current.sys.sunset)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Forecast Tabs */}
                  <Tabs defaultValue="daily" className="mb-6">
                    <TabsList className="mb-4">
                      <TabsTrigger value="daily">
                        <Calendar className="h-4 w-4 mr-2" />
                        Daily Forecast
                      </TabsTrigger>
                      <TabsTrigger value="hourly">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Hourly Forecast
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="daily">
                      <Card className="shadow-md">
                        <CardHeader>
                          <CardTitle>5-Day Forecast</CardTitle>
                          <CardDescription>
                            Weather forecast for the next 5 days
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {data.forecast.daily.slice(0, 5).map((day, index) => (
                              <div key={day.dt} className={index !== 0 ? "pt-4 border-t" : ""}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-10 font-medium">
                                      {index === 0 ? 'Today' : formatDate(day.dt, { weekday: 'short' })}
                                    </div>
                                    <div className="ml-2">
                                      <img 
                                        src={getWeatherIcon(day.weather[0].icon)} 
                                        alt={day.weather[0].description}
                                        className="w-10 h-10"
                                      />
                                    </div>
                                    <div className="ml-2">
                                      <span className="capitalize">{day.weather[0].description}</span>
                                      <div className="flex items-center mt-1 space-x-2">
                                        {getPrecipitationBadge(day.pop)}
                                        <div className="flex items-center text-sm">
                                          <Droplets className="w-3 h-3 mr-1" />
                                          {day.humidity}%
                                        </div>
                                        <div className="flex items-center text-sm">
                                          <Wind className="w-3 h-3 mr-1" />
                                          {formatWindSpeed(day.wind_speed)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <div className="font-medium">
                                        {formatTemp(day.temp.max)}
                                      </div>
                                      <div className="text-sm text-slate-500">
                                        {formatTemp(day.temp.min)}
                                      </div>
                                    </div>
                                    <Badge 
                                      className={getTemperatureColor(day.temp.day)}
                                      variant="outline"
                                    >
                                      {formatTemp(day.temp.day)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="hourly">
                      <Card className="shadow-md">
                        <CardHeader>
                          <CardTitle>Hourly Forecast</CardTitle>
                          <CardDescription>
                            Weather forecast for the next 24 hours
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {data.forecast.hourly.slice(0, 24).map((hour, index) => (
                              <div 
                                key={hour.dt}
                                className="flex flex-col items-center p-3 rounded-lg bg-slate-50"
                              >
                                <div className="font-medium text-sm">
                                  {index === 0 ? 'Now' : formatTime(hour.dt)}
                                </div>
                                <img 
                                  src={getWeatherIcon(hour.weather[0].icon)} 
                                  alt={hour.weather[0].description}
                                  className="w-12 h-12"
                                />
                                <Badge 
                                  className={getTemperatureColor(hour.temp)}
                                  variant="outline"
                                >
                                  {formatTemp(hour.temp)}
                                </Badge>
                                <div className="text-xs capitalize mt-1">
                                  {hour.weather[0].description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  
                  {/* Weather Map */}
                  <Card className="shadow-md mb-6">
                    <CardHeader>
                      <CardTitle>Weather Map</CardTitle>
                      <CardDescription>
                        Interactive map showing weather conditions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      <div className="h-[400px] relative">
                        <MapContainer 
                          center={[data.current.coord.lat, data.current.coord.lon] as [number, number]} 
                          zoom={8} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {/* Add weather layers */}
                          <TileLayer
                            url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${process.env.OPENWEATHER_API_KEY}`}
                          />
                          <TileLayer
                            url={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${process.env.OPENWEATHER_API_KEY}`}
                          />
                          <CustomMarker position={[data.current.coord.lat, data.current.coord.lon] as [number, number]}>
                            <Popup>
                              <div className="text-center">
                                <h3 className="font-bold">{data.current.name}</h3>
                                <img 
                                  src={getWeatherIcon(data.current.weather[0].icon)} 
                                  alt={data.current.weather[0].description}
                                  className="w-12 h-12 mx-auto"
                                />
                                <p className="capitalize">{data.current.weather[0].description}</p>
                                <p className="text-lg font-medium">{formatTemp(data.current.main.temp)}</p>
                              </div>
                            </Popup>
                          </CustomMarker>
                          <MapCenterUpdater coords={[data.current.coord.lat, data.current.coord.lon] as [number, number]} />
                        </MapContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 text-sm text-slate-500">
                      <p>Map shows live precipitation and cloud coverage data from OpenWeatherMap</p>
                    </CardFooter>
                  </Card>
                </>
              )}
              
              {!data && !isLoading && !isError && (
                <div className="text-center p-12 bg-slate-50 rounded-lg border border-slate-200">
                  <Search className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Search for a location</h3>
                  <p className="text-sm text-slate-500">
                    Enter a city name to get the current weather and forecast
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
}

// Map Center Updater component to keep the map centered when location changes
function MapCenterUpdater({ coords }: { coords: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  
  return null;
}