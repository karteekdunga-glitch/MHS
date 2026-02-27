import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, CalendarDays, Trophy, Users, BellRing, Medal, MapPin } from "lucide-react";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useRankers } from "@/hooks/use-rankers";
import { useStudentLife, type StudentLifeEntry } from "@/hooks/use-additional-content";
import { StudentLifeHeroSlider } from "@/components/StudentLifeHeroSlider";
import { RankersPodium } from "@/components/RankersPodium";
import type { Ranker } from "@shared/schema";
import { RankersHeroSlider } from "@/components/RankersHeroSlider";
import { format } from "date-fns";
import { useEvents } from "@/hooks/use-events";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

export default function Home() {
  const { data: announcements = [] } = useAnnouncements("published");
  const { data: rankers = [] } = useRankers("published");
  const { data: studentLifeData = [], isLoading: isStudentLifeLoading } = useStudentLife("published");
  const studentLifeStories = (studentLifeData as StudentLifeEntry[]) ?? [];
  const { data: sliderEvents = [] } = useEvents({ status: "published", scope: "upcoming" });
  const typedSliderEvents = (sliderEvents as SliderEvent[]) ?? [];
  const hasStudentLifeHero = studentLifeStories.length > 0;
  const publishedRankers = (rankers as Ranker[]) ?? [];
  const topTenRankers = publishedRankers.slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      {hasStudentLifeHero ? (
        <StudentLifeHeroSlider stories={studentLifeStories} variant="home" />
      ) : (
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://pixabay.com/get/gcc4d0f2db5cd10be9006d8600d7de4f5fa84b4b5977c635240012ebc650b8b3c407abd7c3e85506916701c0eb40a1af0fe3278ebde5efdb5e02f7d7295659685_1280.jpg')",
            }}
          />
          <div className="hero-wash" />

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6 mt-16">
            <Badge className="bg-accent text-accent-foreground hover:bg-accent px-4 py-1 text-sm uppercase tracking-widest font-bold">
              Admissions Open 2024-25
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-shadow leading-tight">
              Nurturing Excellence,<br />Shaping Futures.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 font-medium max-w-2xl mx-auto text-shadow">
              Montessori High School provides a transformative educational experience in a disciplined and inspiring environment.
            </p>
            {isStudentLifeLoading && (
              <p className="text-sm text-white/80">Loading student life highlights...</p>
            )}
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
      )}

      {typedSliderEvents.length > 0 && (
        <section className="bg-[#041737] text-white py-12 px-4">
          <div className="container mx-auto space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-[#F5C542] tracking-[0.4em] uppercase font-semibold">
                  Upcoming
                </p>
                <h2 className="text-3xl md:text-4xl font-bold">Don't Miss These Highlights</h2>
                <p className="text-primary-100/90">
                  Freshly published events powered directly from the admin dashboard.
                </p>
              </div>
              <Button
                variant="secondary"
                className="rounded-full px-6 text-primary font-semibold"
                asChild
              >
                <a href="/events">View All Events</a>
              </Button>
            </div>
            <EventsHeroSlider events={typedSliderEvents} />
          </div>
        </section>
      )}

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

        {/* Rankers Spotlight */}
        {publishedRankers.length > 0 ? (
          <section className="-mx-4 sm:-mx-6 lg:-mx-8 rounded-3xl overflow-hidden shadow-2xl">
            <RankersHeroSlider rankers={publishedRankers} />
          </section>
        ) : (
          <section className="text-center py-16 bg-muted/40 rounded-2xl border border-dashed border-border">
            Rankers data will go live automatically once exam results are published.
          </section>
        )}

      </main>

  <Footer />
    </div>
  );
}

type SliderEvent = {
  id: number;
  title: string;
  description?: string | null;
  location: string;
  category: string;
  startDateTime: string;
  images?: Array<{ id: number; imageUrl: string }>;
};

function EventsHeroSlider({ events }: { events: SliderEvent[] }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi) return;
    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselApi]);

  return (
    <Carousel setApi={setCarouselApi} className="w-full">
      <CarouselContent>
        {events.slice(0, 5).map((event) => (
          <CarouselItem key={event.id}>
            <div className="relative h-[320px] md:h-[360px] rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={
                  event.images?.[0]?.imageUrl ||
                  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80"
                }
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041737]/95 via-[#041737]/70 to-transparent" />
              <div className="relative h-full flex flex-col justify-center gap-4 p-8 md:p-12 max-w-xl">
                <Badge className="w-fit bg-[#F5C542] text-primary font-semibold">
                  {event.category || "Campus Life"}
                </Badge>
                <h3 className="text-3xl font-bold">{event.title}</h3>
                <p className="text-primary-100 line-clamp-2">{event.description}</p>
                <div className="flex flex-wrap gap-4 text-primary-100/90 text-sm">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#F5C542]" />
                    {format(new Date(event.startDateTime), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#F5C542]" />
                    {event.location}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button className="rounded-full px-5" size="lg" asChild>
                    <a href={`/events?highlight=${event.id}`}>View Details</a>
                  </Button>
                  <Button variant="outline" className="rounded-full px-5 text-white border-white" size="lg" asChild>
                    <a href="/admissions">Plan Visit</a>
                  </Button>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="border-none bg-white/80 text-primary hover:bg-white absolute left-6 top-1/2 -translate-y-1/2" />
      <CarouselNext className="border-none bg-white/80 text-primary hover:bg-white absolute right-6 top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
