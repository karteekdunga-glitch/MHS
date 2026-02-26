import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Trophy, Users, BellRing, Medal } from "lucide-react";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useRankers } from "@/hooks/use-rankers";
import { useFaculty } from "@/hooks/use-faculty";
import { format } from "date-fns";

export default function Home() {
  const { data: announcements = [] } = useAnnouncements("published");
  const { data: rankers = [] } = useRankers("published");
  const { data: faculty = [] } = useFaculty("published");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* landing page hero scenic school building or students */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://pixabay.com/get/gcc4d0f2db5cd10be9006d8600d7de4f5fa84b4b5977c635240012ebc650b8b3c407abd7c3e85506916701c0eb40a1af0fe3278ebde5efdb5e02f7d7295659685_1280.jpg')" }}
        />
        <div className="hero-wash" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 mt-16">
          <Badge className="bg-accent text-accent-foreground hover:bg-accent px-4 py-1 text-sm uppercase tracking-widest font-bold">
            Admissions Open 2024-25
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-shadow leading-tight">
            Nurturing Excellence,<br/>Shaping Futures.
          </h1>
          <p className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto text-shadow">
            Montessori High School provides a transformative educational experience in a disciplined and inspiring environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 h-14 rounded-full shadow-xl">
              Explore Academics
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary font-bold text-lg px-8 h-14 rounded-full glass-panel">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Stats/Features Banner */}
      <section className="bg-primary text-primary-foreground py-12 border-y-4 border-accent relative z-20 -mt-12 mx-4 md:mx-auto max-w-6xl rounded-2xl shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 text-center divide-x divide-primary-foreground/20">
          <div className="space-y-2">
            <Trophy className="w-8 h-8 mx-auto text-accent" />
            <div className="text-3xl font-bold">100%</div>
            <div className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">Pass Rate</div>
          </div>
          <div className="space-y-2">
            <Users className="w-8 h-8 mx-auto text-accent" />
            <div className="text-3xl font-bold">50+</div>
            <div className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">Expert Faculty</div>
          </div>
          <div className="space-y-2">
            <Medal className="w-8 h-8 mx-auto text-accent" />
            <div className="text-3xl font-bold">25+</div>
            <div className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">Years Legacy</div>
          </div>
          <div className="space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-accent" />
            <div className="text-3xl font-bold">Modern</div>
            <div className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">Infrastructure</div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-20 container mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        
        {/* Latest Announcements */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest Updates</h2>
              <p className="text-muted-foreground mt-2">News and announcements from the campus</p>
            </div>
            <Button variant="ghost" className="text-primary font-semibold group hidden sm:flex">
              View All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.slice(0, 3).map((announcement) => (
              <Card key={announcement.id} className="hover-elevate overflow-hidden border-none shadow-md bg-card">
                <div className="bg-primary/5 p-6 h-full flex flex-col">
                  <div className="flex items-center gap-2 text-primary text-sm font-bold mb-4">
                    <BellRing className="w-4 h-4" />
                    <span>{format(new Date(announcement.createdAt || new Date()), "MMM dd, yyyy")}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{announcement.title}</h3>
                  <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">{announcement.content}</p>
                  <Button variant="link" className="px-0 w-fit text-primary font-bold hover:no-underline hover:text-accent">
                    Read More <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {announcements.length === 0 && (
              <div className="col-span-3 text-center py-12 text-muted-foreground bg-muted/50 rounded-xl border border-dashed border-border">
                No recent announcements.
              </div>
            )}
          </div>
        </section>

        {/* Top Rankers - Horizontal Scroll / Grid */}
        <section className="bg-slate-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-20 border-y border-border/50">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Pride, Our Achievers</h2>
            <p className="text-muted-foreground text-lg">Consistent excellence in board examinations year after year.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {rankers.slice(0, 4).map((ranker) => (
              <div key={ranker.id} className="relative group perspective-1000">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-border/50 text-center hover-elevate transition-transform duration-500">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg border-4 border-white z-10 text-xl font-bold text-accent-foreground">
                    #{ranker.rank}
                  </div>
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-primary/10 mt-4">
                    {/* student portrait placeholder */}
                    <img 
                      src={ranker.imageUrl || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop"} 
                      alt={ranker.studentName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{ranker.studentName}</h3>
                  <div className="text-primary font-bold text-lg mt-1">{ranker.score} Marks</div>
                  <Badge variant="secondary" className="mt-3 bg-muted text-muted-foreground">Class of {ranker.year}</Badge>
                </div>
              </div>
            ))}
            {rankers.length === 0 && (
              <div className="col-span-4 text-center py-12 text-muted-foreground">
                Rankers data will be updated soon.
              </div>
            )}
          </div>
        </section>

        {/* Faculty */}
        <section id="faculty">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Distinguished Faculty</h2>
            <p className="text-muted-foreground text-lg">Learn from experienced educators dedicated to student success.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {faculty.slice(0, 4).map((member) => (
              <Card key={member.id} className="border-none shadow-lg overflow-hidden group">
                <div className="h-64 overflow-hidden relative">
                  {/* teacher portrait placeholder */}
                  <img 
                    src={member.imageUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop"} 
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <CardContent className="p-6 text-center bg-card">
                  <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                  <p className="text-primary font-medium mt-1">{member.role}</p>
                  <p className="text-sm text-muted-foreground mt-2">{member.department}</p>
                </CardContent>
              </Card>
            ))}
            {faculty.length === 0 && (
              <div className="col-span-4 text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                Faculty profiles coming soon.
              </div>
            )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
