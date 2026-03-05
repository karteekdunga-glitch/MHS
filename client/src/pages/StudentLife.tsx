import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { StudentLifeHeroSlider } from "@/components/StudentLifeHeroSlider";
import { useStudentLife, type StudentLifeEntry } from "@/hooks/use-additional-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

function MediaCarousel({ images }: { images: StudentLifeEntry["images"] }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi || !images || images.length <= 1) return;
    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 2000);
    return () => clearInterval(interval);
  }, [carouselApi, images]);

  const slides = images?.length ? images : [];

  return slides.length ? (
    <Carousel className="w-full" opts={{ loop: slides.length > 1 }} setApi={setCarouselApi}>
      <CarouselContent>
        {slides.map((image) => (
          <CarouselItem key={image.id}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
              <img src={image.imageUrl} alt="Student life moment" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {slides.length > 1 && (
        <>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </>
      )}
    </Carousel>
  ) : (
    <div className="flex min-h-[16rem] w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-muted-foreground">
      Images coming soon
    </div>
  );
}

export default function StudentLife() {
  const { data = [], isLoading } = useStudentLife("published");
  const stories = (data as StudentLifeEntry[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-1">
        {stories.length > 0 && (
          <StudentLifeHeroSlider stories={stories} variant="page" />
        )}
        <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center space-y-4 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-primary-foreground/80">Student Life</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Celebrating Everyday Wonders on Campus
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/90">
              Dive into mesmerising photo stories, cultural showcases, field trips, and leadership journeys
              curated directly by the Montessori EM High School community.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : stories.length === 0 ? (
            <Card className="max-w-2xl mx-auto text-center shadow-lg">
              <CardContent className="py-16 space-y-3">
                <h2 className="text-2xl font-semibold text-primary">Stories coming soon.</h2>
                <p className="text-muted-foreground">
                  The admin team is curating vibrant student life highlights. Please check back shortly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
              {stories.map((story) => (
                <div key={story.id} id={`story-${story.id}`}>
                  <Card className="flex flex-col border-0 shadow-xl">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="capitalize">
                          Student Spotlight
                        </Badge>
                        {story.highlightTag && (
                          <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {story.highlightTag}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-2xl">{story.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "—"}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col space-y-4">
                      <MediaCarousel images={story.images} />
                      <p className="text-slate-600 leading-relaxed">{story.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

