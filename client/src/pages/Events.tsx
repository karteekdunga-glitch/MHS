import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/use-events";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { CalendarDays, Clock, MapPin, Sparkles } from "lucide-react";

type PublicEvent = {
  id: number;
  title: string;
  description?: string | null;
  location: string;
  category: string;
  status: string;
  startDateTime: string;
  endDateTime?: string | null;
  images: Array<{ id: number; imageUrl: string }>;
};

const TIME_FILTERS = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

export default function Events() {
  const { data: events = [], isLoading } = useEvents({ status: "published" });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  const categories = useMemo(() => {
    const unique = new Set<string>();
    (events as PublicEvent[]).forEach((event) => {
      if (event.category) unique.add(event.category);
    });
    return Array.from(unique);
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return (events as PublicEvent[]).filter((event) => {
      const start = new Date(event.startDateTime).getTime();
      const end = new Date(event.endDateTime ?? event.startDateTime).getTime();
      const isUpcoming = end >= now;
      const matchesTime =
        timeFilter === "all" ||
        (timeFilter === "upcoming" && isUpcoming) ||
        (timeFilter === "past" && !isUpcoming);
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchesTime && matchesCategory;
    });
  }, [events, categoryFilter, timeFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <header className="relative overflow-hidden bg-primary text-primary-foreground py-20">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
          <Badge className="w-fit bg-accent text-accent-foreground px-4 py-1 rounded-full text-xs uppercase tracking-[0.3em]">
            EXPERIENCE
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
            School Events & Celebrations
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl">
            Catch every competition, campus festival, and leadership program curated by Montessori EM High School.
          </p>
          <div className="flex flex-wrap gap-4 text-primary-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Student Life Highlights
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Updated in Real Time
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="bg-white rounded-2xl shadow-sm border p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {TIME_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "outline"}
                onClick={() => setTimeFilter(filter.value)}
                className="rounded-full"
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setCategoryFilter("all")}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-20">Loading curated events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 border border-dashed rounded-2xl bg-white">
              No events found for the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event }: { event: PublicEvent }) {
  const hasGallery = event.images?.length > 0;
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
      <div className="relative">
        {hasGallery ? (
          <Carousel className="w-full">
            <CarouselContent>
              {event.images.map((image) => (
                <CarouselItem key={image.id}>
                  <img
                    src={image.imageUrl}
                    alt={event.title}
                    className="h-72 w-full object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white/80 text-primary border-none shadow-lg" />
            <CarouselNext className="bg-white/80 text-primary border-none shadow-lg" />
          </Carousel>
        ) : (
          <div className="h-72 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-muted-foreground">
            Gallery will be added soon.
          </div>
        )}
        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
          {event.category || "Campus"}
        </Badge>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{event.title}</h2>
          <p className="text-muted-foreground">{event.description}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {format(new Date(event.startDateTime), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {format(new Date(event.startDateTime), "hh:mm a")} –{" "}
            {format(new Date(event.endDateTime ?? event.startDateTime), "hh:mm a")}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {event.location}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full" size="sm">
            Save The Date
          </Button>
          <Button variant="outline" className="rounded-full" size="sm" asChild>
            <a href="/admissions">Contact Team</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
