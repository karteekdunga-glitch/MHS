import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Medal } from "lucide-react";
import type { Ranker } from "@shared/schema";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80";

type RankerWithMeta = Ranker & {
  hallTicket?: string | null;
  className?: string | null;
  percentage?: number | null;
  examName?: string | null;
};

export function RankersHeroSlider({ rankers }: { rankers: RankerWithMeta[] }) {
  const slides = useMemo(() => {
    return rankers
      .filter((item) => item.status === "published")
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);
  }, [rankers]);
  const hasMultiple = slides.length > 1;
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setActiveIndex(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || !hasMultiple) return;
    const interval = setInterval(() => {
      const nextIndex = (carouselApi.selectedScrollSnap() + 1) % slides.length;
      carouselApi.scrollTo(nextIndex);
    }, 2000);
    return () => clearInterval(interval);
  }, [carouselApi, hasMultiple, slides.length]);

  if (!slides.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,31,64,0.6),_rgba(1,5,14,0.95))]" />
      <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <Carousel
        className="relative"
        setApi={setCarouselApi}
        opts={{ loop: hasMultiple }}
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              <article className="grid min-h-[600px] w-full gap-6 overflow-hidden lg:grid-cols-[3fr,2fr]">
                <div className="relative flex min-h-[360px] items-center justify-center">
                  <img
                    src={slide.imageUrl || FALLBACK_IMAGE}
                    alt={slide.studentName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/30" />
                  <div className="relative z-10 w-full max-w-4xl px-6 py-14">
                    <Badge className="bg-amber-400/20 text-amber-100">
                      #{slide.rank} Ranker
                    </Badge>
                    <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                      {slide.studentName}
                    </h2>
                    <p className="mt-3 text-lg text-slate-100/90">
                      {slide.examName || "Board Examination"} ·{" "}
                      {slide.className || `Class ${slide.year}`}
                    </p>
                    <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                      <StatPill label="Hall Ticket" value={slide.hallTicket || "—"} />
                      <StatPill label="Marks" value={`${slide.score} Marks`} />
                      <StatPill
                        label="Percentage"
                        value={
                          slide.percentage !== undefined && slide.percentage !== null
                            ? `${(Math.round(slide.percentage * 100) / 100).toFixed(2)}%`
                            : "NA"
                        }
                      />
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <Button size="lg" className="rounded-full px-8" asChild>
                        <a
                          href={`/results?hallTicket=${encodeURIComponent(
                            slide.hallTicket || "",
                          )}&class=${encodeURIComponent(slide.className || "")}`}
                        >
                          View Result
                        </a>
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-full border border-white/30 bg-transparent px-8 text-white hover:bg-white/10"
                        size="lg"
                        asChild
                      >
                        <a href="/rankers">Open Celebration Page</a>
                      </Button>
                    </div>
                  </div>
                  <div className="absolute -left-10 top-8 hidden h-32 w-32 items-center justify-center rounded-full bg-white/10 text-4xl font-black text-white shadow-2xl lg:flex">
                    #{slide.rank}
                  </div>
                </div>
                <aside className="relative flex flex-col justify-between rounded-t-3xl bg-white/5 p-6 backdrop-blur">
                  <div className="space-y-4">
                    <Badge variant="secondary" className="w-fit bg-white/15 text-slate-100">
                      Spotlighted Ranker
                    </Badge>
                    <p className="text-sm text-slate-200/90">
                      Powered directly by admin results uploads. Every slide is sourced from
                      your structured database without manual duplication.
                    </p>
                  </div>
                  <div className="space-y-4 rounded-2xl bg-white/5 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <Medal className="h-5 w-5 text-amber-300" />
                      Performance Snapshot
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-white/70">Academic Year</span>
                        <span className="font-semibold text-white">
                          {slide.year}
                        </span>
                      </li>
                      <li className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-white/70">Status</span>
                        <span className="font-semibold text-emerald-300">PASSED</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-white/70">Source</span>
                        <span className="font-semibold text-white">
                          {(slide as any).source === "auto" ? "Auto-synced" : "Manual"}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/30 p-5 text-white">
                    <div className="flex items-center gap-3">
                      <Crown className="h-8 w-8 text-amber-200" />
                      <div>
                        <p className="text-sm uppercase tracking-[0.4em] text-white/80">
                          Honors Board
                        </p>
                        <p className="text-2xl font-bold">
                          #{slide.rank} Excellence Award
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-white/80">
                      Appears on homepage hero + celebration wall automatically whenever
                      results are imported.
                    </p>
                  </div>
                </aside>
              </article>
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
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <span
              key={slide.id}
              className={cn(
                "h-2 w-8 rounded-full bg-white/30 transition",
                index === activeIndex && "bg-white",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}
