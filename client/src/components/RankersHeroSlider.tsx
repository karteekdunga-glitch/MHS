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
import { Crown, Medal } from "lucide-react";
import type { Ranker } from "@shared/schema";
import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/SchoolLogo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80";
const AUTO_PLAY_INTERVAL = 3800;

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
    }, AUTO_PLAY_INTERVAL);
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
              <article className="grid min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#030816] via-[#071631] to-[#020817] shadow-2xl lg:grid-cols-[1.1fr,0.9fr]">
                <div className="relative min-h-[320px]">
                  <img
                    src={slide.imageUrl || FALLBACK_IMAGE}
                    alt={slide.studentName}
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent" />
                  <img
                    src={slide.imageUrl || FALLBACK_IMAGE}
                    alt={slide.studentName}
                    className="absolute inset-0 h-full w-full object-contain object-center p-4 sm:p-6 lg:p-8"
                  />
                  <SchoolLogo
                    size={74}
                    className="absolute top-6 left-6 rounded-full border-4 border-white/70 bg-white/95 p-2 shadow-2xl"
                  />
                  <div className="absolute top-6 left-28 rounded-full border border-white/30 bg-white/90 px-5 py-1.5 text-base font-semibold text-slate-900 shadow-xl">
                    #{slide.rank} Ranker
                  </div>
                </div>
                <div className="flex flex-col gap-6 px-6 py-10 sm:px-10">
                  <div className="space-y-3">
                    <Badge variant="secondary" className="w-fit bg-white/15 text-slate-100">
                      Spotlighted Ranker
                    </Badge>
                    <h2 className="text-3xl font-bold leading-tight md:text-4xl">{slide.studentName}</h2>
                    <p className="text-lg text-slate-200/90">
                      {slide.examName || "Board Examination"} • {slide.className || `Class ${slide.year}`}
                    </p>
                    <p className="text-sm text-white/70">
                      Verified directly from the admin uploads — no manual edits, just live academic data.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatPill label="Hall Ticket" value={slide.hallTicket || "--"} />
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
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Medal className="h-5 w-5 text-amber-300" />
                        Performance Snapshot
                      </h3>
                      <ul className="mt-3 space-y-3 text-sm">
                        <li className="flex items-center justify-between border-b border-white/10 pb-2 text-white/70">
                          <span>Academic Year</span>
                          <span className="font-semibold text-white">{slide.year}</span>
                        </li>
                        <li className="flex items-center justify-between border-b border-white/10 pb-2 text-white/70">
                          <span>Status</span>
                          <span className="font-semibold text-emerald-300">PASSED</span>
                        </li>
                        <li className="flex items-center justify-between text-white/70">
                          <span>Source</span>
                          <span className="font-semibold text-white">
                            {(slide as any).source === "auto" ? "Auto-synced" : "Manual"}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-400/20 to-amber-600/30 p-5 text-white">
                      <div className="flex items-center gap-3">
                        <Crown className="h-7 w-7 text-amber-100" />
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.5em] text-white/80">Honors Board</p>
                          <p className="text-2xl font-bold">#{slide.rank} Excellence</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/85">
                        Featured on the homepage slider and celebration page automatically whenever the admin publishes results.
                      </p>
                    </div>
                  </div>
                </div>
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

