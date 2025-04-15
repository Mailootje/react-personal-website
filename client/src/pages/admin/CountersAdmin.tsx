import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Loader2,
  RefreshCw,
  Search, 
  FilterX,
  ArrowUp,
  BarChart,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConversionCounter } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface CountersResponse {
  counters: ConversionCounter[];
  meta: {
    total: number;
  };
}

export default function CountersAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery<CountersResponse>({
    queryKey: ["/api/admin/counters", searchTerm],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      
      const url = `/api/admin/counters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return apiRequest("GET", url);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", `/api/admin/counters/${encodeURIComponent(name)}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/counters"] });
      toast({
        title: "Success",
        description: "Counter has been reset to zero",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reset counter: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Find the max count to calculate relative percentages for the progress bars
  const maxCount = data?.counters.reduce((max, counter) => Math.max(max, counter.count), 0) || 0;

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-16 text-white">
        <div className="bg-black min-h-screen">
          <Container>
            <div className="py-8">
              <div className="flex items-center mb-6">
                <Link href="/admin" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors mr-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <SectionHeading
                  subtitle="ADMIN PANEL"
                  title="Conversion Counters"
                />
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search counters by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md"
                    />
                    <Button type="submit" variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                    {searchTerm && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSearchTerm("")}
                      >
                        <FilterX className="h-4 w-4" />
                      </Button>
                    )}
                  </form>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center p-8">
                    <p className="text-red-500 mb-4">Failed to load counters</p>
                    <Button 
                      variant="outline" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/counters"] })}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : data?.counters.length === 0 ? (
                  <div className="text-center p-12">
                    <p className="text-muted-foreground mb-4">No conversion counters found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[150px] text-right">Count</TableHead>
                          <TableHead>Distribution</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.counters.map((counter) => (
                          <TableRow key={counter.name}>
                            <TableCell className="font-medium flex items-center">
                              <BarChart className="h-4 w-4 mr-2 text-primary" />
                              {counter.name}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {counter.count.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={maxCount ? (counter.count / maxCount) * 100 : 0} 
                                  className="h-2" 
                                />
                                <span className="text-xs text-muted-foreground w-10">
                                  {maxCount ? Math.round((counter.count / maxCount) * 100) : 0}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => resetMutation.mutate(counter.name)}
                                disabled={resetMutation.isPending}
                                className="gap-1"
                              >
                                {resetMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Reset
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <ArrowUp className="h-5 w-5 mr-2 text-green-500" />
                    Top Counter
                  </h3>
                  {data?.counters && data.counters.length > 0 ? (
                    <>
                      {(() => {
                        const topCounter = [...(data.counters)].sort((a, b) => b.count - a.count)[0];
                        return (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-sm">{topCounter.name}</p>
                            <p className="text-3xl font-bold">{topCounter.count.toLocaleString()}</p>
                            <Progress value={100} className="h-1.5" />
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-2">Total Conversions</h3>
                  {data?.counters && data.counters.length > 0 ? (
                    <p className="text-3xl font-bold">
                      {data.counters.reduce((sum, counter) => sum + counter.count, 0).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
                
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-2">Counter Types</h3>
                  {data?.counters && data.counters.length > 0 ? (
                    <p className="text-3xl font-bold">{data.counters.length}</p>
                  ) : (
                    <p className="text-muted-foreground">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
      <Footer />
    </>
  );
}