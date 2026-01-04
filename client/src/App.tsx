import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import RegisterCollege from "@/pages/RegisterCollege";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import GuardDashboard from "@/pages/GuardDashboard";
import StudentRegistration from "@/pages/StudentRegistration";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={RegisterCollege} />
      
      {/* Role Protected Routes (handled by navigation logic inside pages) */}
      <Route path="/superadmin/dashboard" component={SuperAdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/guard/dashboard" component={GuardDashboard} />
      
      {/* Public Student Routes */}
      <Route path="/seminar/:id/register" component={StudentRegistration} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
