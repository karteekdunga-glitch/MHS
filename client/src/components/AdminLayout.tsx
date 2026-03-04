import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { LayoutDashboard, Megaphone, Users, CalendarDays, Medal, LogOut, Loader2, BookOpen, Heart, ClipboardCheck, UserPlus, Menu, PanelLeft, PanelLeftOpen, MoreHorizontal, Quote } from "lucide-react";
import { SchoolLogo } from "@/components/SchoolLogo";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  
  if (!user) {
    return null;
  }

  const navItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
    { title: "Academics", url: "/admin/academics", icon: BookOpen },
    { title: "Student Life", url: "/admin/student-life", icon: Heart },
    { title: "Head Master", url: "/admin/headmaster", icon: Quote },
    { title: "Faculty Profiles", url: "/admin/faculty", icon: Users },
    { title: "Events", url: "/admin/events", icon: CalendarDays },
    { title: "Rankers", url: "/admin/rankers", icon: Medal },
    { title: "Exam Results", url: "/admin/results", icon: ClipboardCheck },
    { title: "Admissions", url: "/admin/admissions", icon: UserPlus },
  ];

  return (
    <SidebarProvider>
      <AdminChrome
        navItems={navItems}
        user={user}
        location={location}
        logoutMutation={logoutMutation}
      >
        {children}
      </AdminChrome>
    </SidebarProvider>
  );
}

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

function AdminChrome({
  navItems,
  user,
  location,
  logoutMutation,
  children,
}: {
  navItems: NavItem[];
  user: any;
  location: string;
  logoutMutation: ReturnType<typeof useLogout>;
  children: React.ReactNode;
}) {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const handleMobileToggle = () => {
    if (isMobile) {
      setOpenMobile(true);
    } else {
      toggleSidebar();
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar className="border-r border-[#0B2F5B]/25 shadow-2xl">
        <SidebarHeader className="p-4 py-6">
          <div className="flex items-center gap-3 px-2 text-primary">
            <SchoolLogo size={48} className="h-12 w-12 rounded-full bg-white/95 p-1 shadow-md" />
            <div className="font-bold font-serif leading-tight text-sidebar-foreground">
              <div>Montessori EM HS</div>
              <div className="text-xs text-white/70 font-sans tracking-wide">Admin Portal</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-white/70">Content Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location === item.url}
                      className="font-medium"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between px-2 mb-4 text-white">
            <div className="text-sm font-medium truncate pr-2">{user.email}</div>
            <Badge variant="outline" className="bg-[#F5C542]/20 text-[#F5C542] uppercase text-[10px] border-[#F5C542]/40">{user.role}</Badge>
          </div>
          <Button 
            variant="destructive" 
            className="w-full justify-start text-destructive-foreground" 
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 bg-white border-b px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="hidden md:inline-flex border-primary/20"
              onClick={toggleSidebar}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-primary/20"
              onClick={handleMobileToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <MoreHorizontal className="hidden md:block h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">
              {navItems.find(i => i.url === location)?.title || "Dashboard"}
            </h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">View Public Site</Link>
          </Button>
        </header>
        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

// Simple Badge component fallback since it might not be in generic ui components list
function Badge({ children, className, variant = "default" }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
