import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { StudentLifeEntry } from "@/hooks/use-additional-content";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80";
const AUTO_PLAY_INTERVAL = 3800;

export type StudentLifeHeroVariant = "home" | "page";

export function StudentLifeHeroSlider({
  stories,
  variant = "home",
}: {
  stories: StudentLifeEntry[];
  variant?: StudentLifeHeroVariant;
}) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = stories.length > 1;
  const sliderStories = useMemo(() => stories.slice(0, 6), [stories]);

  useEffect(() => {
    if (!carouselApi) return;
    const handler = () => setActiveIndex(carouselApi.selectedScrollSnap());
    handler();
    carouselApi.on("select", handler);
    return () => {
      carouselApi.off("select", handler);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi || !hasMultiple) return;
    const interval = setInterval(() => {
      const nextIndex = (carouselApi.selectedScrollSnap() + 1) % sliderStories.length;
      carouselApi.scrollTo(nextIndex);
    }, AUTO_PLAY_INTERVAL);
    return () => clearInterval(interval);
  }, [carouselApi, hasMultiple, sliderStories.length]);

  if (!sliderStories.length) return null;

  const heightClass =
    variant === "home"
      ? "min-h-[720px] h-[calc(100vh-80px)]"
      : "min-h-[480px] h-[70vh]";

  return (
    <section className={cn("relative w-full overflow-hidden bg-slate-950 text-white", heightClass)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(44,82,130,0.45),_rgba(2,8,23,0.9))]" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
      <Carousel
        setApi={setCarouselApi}
        className="relative h-full"
        opts={{ loop: hasMultiple }}
      >
        <CarouselContent className="h-full" containerClassName="h-full">
          {sliderStories.map((story) => {
            const heroImage = story.images?.[0]?.imageUrl || PLACEHOLDER_IMAGE;
            return (
              <CarouselItem key={story.id} className="h-full">
                <div className="relative flex h-full w-full overflow-hidden">
                  <img
                    src={heroImage}
                    alt={story.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-transparent" />
                  <div className="absolute inset-y-0 left-0 w-[54%] bg-gradient-to-r from-[#041737]/52 via-[#041737]/20 to-transparent" />
                  <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-6 py-10 text-left">
                    <div className="w-full max-w-3xl border-l-4 border-[#F5C542] pl-5 md:pl-7">
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-slate-100">
                        <span className="flex items-center gap-2 text-accent drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                          <Sparkles className="h-4 w-4" /> Student Life
                        </span>
                        {story.highlightTag && (
                          <Badge variant="secondary" className="bg-white/25 text-white shadow-sm">
                            {story.highlightTag}
                          </Badge>
                        )}
                      </div>
                      <h2 className="mt-6 text-4xl font-bold leading-tight text-white drop-shadow-[0_8px_22px_rgba(0,0,0,0.48)] md:text-5xl lg:text-6xl">
                        {story.title}
                      </h2>
                      <p className="mt-4 max-w-3xl text-base leading-relaxed text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.44)] md:text-lg">
                        {story.description.length > 260
                          ? `${story.description.slice(0, 260)}...`
                          : story.description}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-4">
                        <Button size="lg" className="rounded-full px-8" asChild>
                          <a href="/student-life">Explore Student Life</a>
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="rounded-full border border-white/55 bg-white/14 text-white hover:bg-white/24"
                          asChild
                        >
                          <a href={`/student-life#story-${story.id}`}>View Story</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {hasMultiple && (
          <>
            <CarouselPrevious className="left-4 border-none bg-white/70 text-primary hover:bg-white" />
            <CarouselNext className="right-4 border-none bg-white/70 text-primary hover:bg-white" />
          </>
        )}
      </Carousel>
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {sliderStories.map((story, index) => (
            <div
              key={story.id}
              className={cn(
                "h-2 w-10 rounded-full bg-white/30 transition",
                index === activeIndex ? "bg-white" : ""
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
