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
import AdminResults from "@/pages/AdminResults";
import AdminAcademics from "@/pages/AdminAcademics";
import AdminAdmissions from "@/pages/AdminAdmissions";
import Results from "@/pages/Results";
import Academics from "@/pages/Academics";
import Admissions from "@/pages/Admissions";
import StudentLife from "@/pages/StudentLife";
import Faculty from "@/pages/Faculty";
import RankersCelebration from "@/pages/RankersCelebration";
import AdminStudentLife from "@/pages/AdminStudentLife";
import AdminEvents from "@/pages/AdminEvents";
import Events from "@/pages/Events";

// Stub pages for additional CRUD sections
const AdminGalleryStub = () => <AdminDashboard />;

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/events" component={Events} />
      <Route path="/results" component={Results} />
      <Route path="/rankers" component={RankersCelebration} />
      <Route path="/academics" component={Academics} />
      <Route path="/admissions" component={Admissions} />
      <Route path="/student-life" component={StudentLife} />
      <Route path="/faculty" component={Faculty} />
      
      {/* Admin Auth Route */}
      <Route path="/admin/login" component={AdminLogin} />
      
      {/* Admin Protected Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/academics" component={AdminAcademics} />
      <Route path="/admin/student-life" component={AdminStudentLife} />
      <Route path="/admin/faculty" component={AdminFaculty} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/admin/gallery" component={AdminGalleryStub} />
      <Route path="/admin/rankers" component={AdminRankers} />
      <Route path="/admin/results" component={AdminResults} />
      <Route path="/admin/admissions" component={AdminAdmissions} />

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
