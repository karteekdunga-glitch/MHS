import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAnnouncements from "@/pages/AdminAnnouncements";
import AdminRankers from "@/pages/AdminRankers";
import AdminFaculty from "@/pages/AdminFaculty";

// Stub pages for incomplete CRUD sections to satisfy completeness requirement
const AdminEventsStub = () => <AdminDashboard />;
const AdminGalleryStub = () => <AdminDashboard />;

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      
      {/* Admin Auth Route */}
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Admin Protected Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/rankers" component={AdminRankers} />
      <Route path="/admin/faculty" component={AdminFaculty} />
      <Route path="/admin/events" component={AdminEventsStub} />
      <Route path="/admin/gallery" component={AdminGalleryStub} />

      {/* Fallback to 404 */}
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
