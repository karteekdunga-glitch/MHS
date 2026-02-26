import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useFaculty } from "@/hooks/use-faculty";
import { useRankers } from "@/hooks/use-rankers";
import { Activity, Megaphone, Users, Medal } from "lucide-react";

export default function AdminDashboard() {
  const { data: announcements } = useAnnouncements();
  const { data: faculty } = useFaculty();
  const { data: rankers } = useRankers();

  const stats = [
    {
      title: "Total Announcements",
      value: announcements?.length || 0,
      icon: Megaphone,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      title: "Faculty Members",
      value: faculty?.length || 0,
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      title: "Registered Rankers",
      value: rankers?.length || 0,
      icon: Medal,
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      title: "System Status",
      value: "Online",
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back, Admin</h2>
          <p className="text-muted-foreground mt-2">Here's an overview of your school's digital presence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-md bg-primary/5">
          <CardHeader>
            <CardTitle>Quick Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p><strong>Visibility:</strong> Items marked as <Badge className="bg-amber-100 text-amber-800">Draft</Badge> will NOT appear on the public website. Change status to <Badge className="bg-green-100 text-green-800">Published</Badge> to make them visible.</p>
            <p><strong>Images:</strong> Currently, image fields accept raw URLs. For testing, you can use Unsplash URLs.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Badge({ children, className }: any) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}
