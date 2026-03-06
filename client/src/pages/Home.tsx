import { useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, BellRing, MapPin, Quote, X } from "lucide-react";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useRankers } from "@/hooks/use-rankers";
import { useStudentLife, useGlobalImages, type StudentLifeEntry, type GlobalImage } from "@/hooks/use-additional-content";
import { useHeadmasterMessages } from "@/hooks/use-headmaster";
import { StudentLifeHeroSlider } from "@/components/StudentLifeHeroSlider";
import { SchoolLogo } from "@/components/SchoolLogo";
import type { Announcement, HeadmasterMessage, Ranker } from "@shared/schema";
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
  const { data: globalImages = [] } = useGlobalImages("published");
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

      <HomeHighlightsSlider images={globalImages} />
      <section className="relative overflow-hidden border-y border-[#0b3a8f] bg-gradient-to-r from-[#031a43] via-[#0b3a8f] to-[#031a43] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.24),_transparent_60%)]" />
        <div className="relative mx-auto flex min-h-[72px] max-w-6xl items-center justify-center px-4 py-4 text-center">
          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-white/45 sm:w-16" />
            <div className="space-y-1">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.45em] text-[#F5C542] sm:text-xs">
                Campus Highlights
              </p>
              <h2 className="font-serif text-lg font-semibold tracking-[0.12em] text-white sm:text-2xl">
                Student Life
              </h2>
            </div>
            <div className="h-px w-10 bg-white/45 sm:w-16" />
          </div>
        </div>
      </section>

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

        {/* Rankers Spotlight */}
        {publishedRankers.length > 0 && (
          <section className="-mx-4 sm:-mx-6 lg:-mx-8 rounded-3xl overflow-hidden shadow-2xl">
            <RankersHeroSlider rankers={publishedRankers} />
          </section>
        )}

      </main>
      <NotificationsPanel announcements={announcements} />
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

function NotificationsPanel({ announcements }: { announcements: Announcement[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragState = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null,
  );

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [announcements]);

  const now = Date.now();
  const isNew = (item: Announcement) => {
    if (!item.createdAt) return false;
    const createdAt = new Date(item.createdAt).getTime();
    return now - createdAt <= 7 * 24 * 60 * 60 * 1000;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const nextX = dragState.current.baseX + (event.clientX - dragState.current.startX);
    const nextY = dragState.current.baseY + (event.clientY - dragState.current.startY);
    setOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-xl"
        onClick={() => setIsOpen(true)}
        aria-label="Open notifications"
      >
        <BellRing className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-40 w-[340px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div
        className="flex cursor-move items-center justify-between gap-3 bg-primary px-4 py-3 text-white"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
          <BellRing className="h-4 w-4" />
          Latest Updates
        </div>
        <button
          type="button"
          className="rounded-full bg-white/20 p-1 hover:bg-white/30"
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            setIsOpen(false);
          }}
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {sortedAnnouncements.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No updates published yet.
          </div>
        ) : (
          sortedAnnouncements.map((announcement) => {
            const link = deriveAnnouncementLink(announcement);
            return (
              <a
                key={announcement.id}
                href={link}
                className="block border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {format(new Date(announcement.createdAt || new Date()), "dd MMM yyyy")}
                  </span>
                  {isNew(announcement) && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {announcement.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {announcement.content}
                </p>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

function deriveAnnouncementLink(announcement: Announcement) {
  if (announcement.link && announcement.link.trim()) {
    return announcement.link.trim();
  }
  const combined = `${announcement.title} ${announcement.content}`.toLowerCase();
  if (combined.includes("result")) return "/results";
  if (combined.includes("ranker")) return "/rankers";
  if (combined.includes("event")) return "/events";
  if (combined.includes("admission")) return "/admissions";
  if (combined.includes("faculty")) return "/faculty";
  if (combined.includes("student life") || combined.includes("student-life") || combined.includes("studentlife")) {
    return "/student-life";
  }
  if (combined.includes("academic")) return "/academics";
  return "/";
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

function HomeHighlightsSlider({ images }: { images: GlobalImage[] }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [failedSlides, setFailedSlides] = useState<number[]>([]);
  const slides = (images ?? [])
    .filter((img) => img.imageUrl || img.imagePath)
    .filter((img) => !failedSlides.includes(img.id))
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((img) => ({
      id: img.id,
      src: img.imagePath ? `/api/assets?path=${encodeURIComponent(img.imagePath)}` : (img.imageUrl as string),
      alt: img.label || "Home highlight",
    }));
  const hasMultiple = slides.length > 1;

  useEffect(() => {
    setFailedSlides([]);
  }, [images]);

  useEffect(() => {
    if (!carouselApi || !hasMultiple) return;
    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 3800);
    return () => clearInterval(interval);
  }, [carouselApi, hasMultiple]);

  if (!slides.length) return null;

  return (
    <section className="w-full overflow-hidden bg-[#041737] leading-none">
      <Carousel setApi={setCarouselApi} className="w-full" opts={{ loop: hasMultiple }}>
        <CarouselContent className="!ml-0 leading-none" containerClassName="leading-none">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="!pl-0 leading-none">
              <div className="relative aspect-[16/7] w-full overflow-hidden bg-[#041737] sm:aspect-[16/6] lg:aspect-[16/5]">
              <img
                src={slide.src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 block h-full w-full scale-105 object-cover object-center blur-sm brightness-[0.72]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#041737]/20 via-transparent to-[#041737]/20" />
              <img
                src={slide.src}
                alt={slide.alt}
                className="relative z-10 block h-full w-full object-contain object-center"
                loading="eager"
                onError={() => {
                  setFailedSlides((current) =>
                    current.includes(slide.id) ? current : [...current, slide.id],
                  );
                }}
              />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {hasMultiple && (
          <>
            <CarouselPrevious className="left-4 border-none bg-white/80 text-primary hover:bg-white" />
            <CarouselNext className="right-4 border-none bg-white/80 text-primary hover:bg-white" />
          </>
        )}
      </Carousel>
    </section>
  );
}
