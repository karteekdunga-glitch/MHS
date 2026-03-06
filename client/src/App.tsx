import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
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
import AdminHeadmaster from "@/pages/AdminHeadmaster";
import Events from "@/pages/Events";
import AdminHomeHighlights from "@/pages/AdminHomeHighlights";
import { useUser } from "@/hooks/use-auth";

function useAuthHistoryRevalidation(refetch: () => Promise<unknown>) {
  const lastRunRef = useRef(0);

  useEffect(() => {
    const revalidate = () => {
      const now = Date.now();
      if (now - lastRunRef.current < 1200) {
        return;
      }
      lastRunRef.current = now;
      void refetch();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidate();
      }
    };

    window.addEventListener("pageshow", revalidate);
    window.addEventListener("popstate", revalidate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", revalidate);
      window.removeEventListener("popstate", revalidate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refetch]);
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedAdminPage({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, refetch } = useUser();
  useAuthHistoryRevalidation(refetch);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.replace("/admin/login");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function GuestOnlyAdminPage({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, refetch } = useUser();
  useAuthHistoryRevalidation(refetch);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.replace("/admin");
    }
  }, [isLoading, user]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (user) {
    return null;
  }

  return <Component />;
}

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
      <Route path="/admin/login">
        <GuestOnlyAdminPage component={AdminLogin} />
      </Route>
      
      {/* Admin Protected Routes */}
      <Route path="/admin">
        <ProtectedAdminPage component={AdminDashboard} />
      </Route>
      <Route path="/admin/announcements">
        <ProtectedAdminPage component={AdminAnnouncements} />
      </Route>
      <Route path="/admin/academics">
        <ProtectedAdminPage component={AdminAcademics} />
      </Route>
      <Route path="/admin/student-life">
        <ProtectedAdminPage component={AdminStudentLife} />
      </Route>
      <Route path="/admin/headmaster">
        <ProtectedAdminPage component={AdminHeadmaster} />
      </Route>
      <Route path="/admin/home-highlights">
        <ProtectedAdminPage component={AdminHomeHighlights} />
      </Route>
      <Route path="/admin/faculty">
        <ProtectedAdminPage component={AdminFaculty} />
      </Route>
      <Route path="/admin/events">
        <ProtectedAdminPage component={AdminEvents} />
      </Route>
      <Route path="/admin/rankers">
        <ProtectedAdminPage component={AdminRankers} />
      </Route>
      <Route path="/admin/results">
        <ProtectedAdminPage component={AdminResults} />
      </Route>
      <Route path="/admin/admissions">
        <ProtectedAdminPage component={AdminAdmissions} />
      </Route>

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
