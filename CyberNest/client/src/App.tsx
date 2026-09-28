import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Hero from "@/pages/Hero";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Scanner from "@/pages/Scanner";
import Reports from "@/pages/Reports";
import History from "@/pages/History";
import Languages from "@/pages/Languages";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Users from "@/pages/admin/Users";
import Scans from "@/pages/admin/Scans";
import Monitoring from "@/pages/admin/Monitoring";
import AIAssistant from "@/pages/AIAssistant";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Hero} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/reports" component={Reports} />
      <Route path="/history" component={History} />
      <Route path="/languages" component={Languages} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={Users} />
      <Route path="/admin/scans" component={Scans} />
      <Route path="/admin/monitoring" component={Monitoring} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
