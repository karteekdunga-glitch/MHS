import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CalendarDays, BellRing, MapPin, Quote } from "lucide-react";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useRankers } from "@/hooks/use-rankers";
import { useStudentLife, type StudentLifeEntry } from "@/hooks/use-additional-content";
import { useHeadmasterMessages } from "@/hooks/use-headmaster";
import { StudentLifeHeroSlider } from "@/components/StudentLifeHeroSlider";
import { SchoolLogo } from "@/components/SchoolLogo";
import type { HeadmasterMessage, Ranker } from "@shared/schema";
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

const FALLBACK_PORTRAIT =
  "https://images.unsplash.com/photo-1541753866388-0b3c701627d3?auto=format&fit=crop&w=900&q=80";

const WELCOME_STORAGE_KEY = "mems-welcome-shown";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Clean up older localStorage flag so past visits can see the splash again.
      window.localStorage.removeItem(WELCOME_STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to access localStorage for splash cleanup", error);
    }
    const hasSeenSplash = window.sessionStorage.getItem(WELCOME_STORAGE_KEY);
    if (hasSeenSplash) return;
    window.sessionStorage.setItem(WELCOME_STORAGE_KEY, "true");
    setShowWelcome(true);
    const timeout = window.setTimeout(() => setShowWelcome(false), 5500);
    return () => window.clearTimeout(timeout);
  }, []);

  const { data: announcements = [] } = useAnnouncements("published");
  const { data: rankers = [] } = useRankers("published");
  const { data: studentLifeData = [], isLoading: isStudentLifeLoading } = useStudentLife("published");
  const studentLifeStories = (studentLifeData as StudentLifeEntry[]) ?? [];
  const { data: sliderEvents = [] } = useEvents({ status: "published", scope: "upcoming" });
  const typedSliderEvents = (sliderEvents as SliderEvent[]) ?? [];
  const { data: headmasterData = [] } = useHeadmasterMessages("published");
  const headmasterMessages = (headmasterData as HeadmasterMessage[]) ?? [];
  const featuredHeadmaster = headmasterMessages[0];
  const hasStudentLifeHero = studentLifeStories.length > 0;
  const publishedRankers = (rankers as Ranker[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showWelcome && <WelcomeSplash />}
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
              Montessori EM High School provides a transformative educational experience in a disciplined and inspiring environment.
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

      {featuredHeadmaster && (
        <HeadMasterWordsSection message={featuredHeadmaster} />
      )}

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

function HeadMasterWordsSection({ message }: { message: HeadmasterMessage }) {
  const portrait = message.imageUrl || FALLBACK_PORTRAIT;
  const quote = message.highlightQuote || "Education is the quiet work of shaping courageous hearts.";
  return (
    <section className="bg-gradient-to-br from-[#031439] via-[#082a66] to-[#031439] text-white py-16">
      <div className="container mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1fr,1.5fr] items-center">
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/20 shadow-2xl">
              <img src={portrait} alt={message.headName} className="w-full h-[420px] object-cover" />
            </div>
            <div className="text-center lg:text-left space-y-1">
              <p className="text-2xl font-semibold">{message.headName}</p>
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">{message.role}</p>
            </div>
          </div>
          <div className="space-y-6">
            <Badge className="w-fit bg-white/10 text-white uppercase tracking-[0.4em]">
              Head Master's Desk
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold leading-tight">{message.title}</h3>
            <p className="text-lg italic text-white/80 flex items-start gap-3">
              <Quote className="w-6 h-6 text-accent" />
              {quote}
            </p>
            <p className="text-white/90 leading-relaxed whitespace-pre-line">
              {message.message}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WelcomeSplash() {
  return (
    <div className="welcome-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-10 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-6 text-center px-8">
        <SchoolLogo size={200} className="welcome-logo drop-shadow-[0_25px_55px_rgba(0,0,0,0.45)]" />
        <div className="welcome-text-wrapper">
          <p className="welcome-outline" data-text="MONTESSORI">
            MONTESSORI
          </p>
          <p className="welcome-outline" data-text="ENGLISH MEDIUM SCHOOL">
            ENGLISH MEDIUM SCHOOL
          </p>
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-white/80">Namaste</p>
      </div>
    </div>
  );
}

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
