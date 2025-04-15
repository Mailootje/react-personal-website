import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Newspaper, 
  Link as LinkIcon, 
  LineChart, 
  BarChart4, 
  Users, 
  Settings,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const adminModules = [
    {
      title: "Blog Posts",
      description: "Manage blog content, create new posts, and edit existing ones.",
      icon: <Newspaper className="h-8 w-8 text-primary" />,
      path: "/admin/blog",
      count: "Blog Posts"
    },
    {
      title: "Shortened Links",
      description: "View and manage all shortened links, including click statistics.",
      icon: <LinkIcon className="h-8 w-8 text-indigo-500" />,
      path: "/admin/links",
      count: "Links"
    },
    {
      title: "Conversion Counters",
      description: "Track and analyze various conversion metrics across the site.",
      icon: <LineChart className="h-8 w-8 text-green-500" />,
      path: "/admin/counters",
      count: "Counters"
    },
    {
      title: "Counter Tokens",
      description: "Manage and view usage of API tokens for counter increments.",
      icon: <BarChart4 className="h-8 w-8 text-yellow-500" />,
      path: "/admin/tokens",
      count: "Tokens"
    },
    {
      title: "User Management",
      description: "Add and manage administrative users and their permissions.",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      path: "/admin/users",
      count: "Users"
    },
    {
      title: "Settings",
      description: "Configure global site settings and admin preferences.",
      icon: <Settings className="h-8 w-8 text-purple-500" />,
      path: "/admin/settings",
      count: null
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-16 bg-black text-white">
        <Container>
          <div className="py-8">
            <SectionHeading
              subtitle="ADMINISTRATION"
              title="Admin Dashboard"
              center
            />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminModules.map((module, index) => (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {module.description}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-black/20 rounded-full">
                      {module.icon}
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-2">
                    <Button asChild className="w-full group">
                      <Link href={module.path} className="flex justify-between items-center">
                        <span>Manage {module.title}</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}