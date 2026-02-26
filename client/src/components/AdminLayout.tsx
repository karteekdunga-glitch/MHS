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
  SidebarFooter
} from "@/components/ui/sidebar";
import { LayoutDashboard, Megaphone, Users, CalendarDays, Image as ImageIcon, Medal, LogOut, Loader2, GraduationCap } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  
  if (!user) {
    setLocation("/admin/login");
    return null;
  }

  const navItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
    { title: "Faculty Profiles", url: "/admin/faculty", icon: Users },
    { title: "Events", url: "/admin/events", icon: CalendarDays },
    { title: "Gallery", url: "/admin/gallery", icon: ImageIcon },
    { title: "Rankers", url: "/admin/rankers", icon: Medal },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-4 py-6">
            <div className="flex items-center gap-2 px-2 text-primary">
              <GraduationCap className="h-8 w-8" />
              <div className="font-bold font-serif leading-tight">
                <div>Montessori</div>
                <div className="text-xs text-muted-foreground font-sans">Admin Portal</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider">Content Management</SidebarGroupLabel>
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
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="text-sm font-medium truncate pr-2">{user.email}</div>
              <Badge variant="outline" className="bg-primary/10 text-primary uppercase text-[10px]">{user.role}</Badge>
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
          <header className="h-16 bg-white border-b px-8 flex items-center justify-between sticky top-0 z-10">
            <h1 className="text-xl font-bold text-foreground">
              {navItems.find(i => i.url === location)?.title || "Dashboard"}
            </h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">View Public Site</Link>
            </Button>
          </header>
          <div className="p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Simple Badge component fallback since it might not be in generic ui components list
function Badge({ children, className, variant = "default" }: any) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}
