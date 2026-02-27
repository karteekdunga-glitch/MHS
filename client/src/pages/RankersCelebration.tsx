import { useMemo } from "react";
import type { Ranker } from "@shared/schema";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResults } from "@/hooks/use-additional-content";
import { RankersPodium } from "@/components/RankersPodium";
import {
  summariseSubjects,
  inferSubjectsFromRecord,
  normalizeResultData,
  formatPercentage,
  type SubjectResult,
  slugifyClass,
} from "@/lib/results";
import { Loader2, Trophy, Sparkles } from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";

interface ResultRecord {
  id: number;
  rollNo: string;
  studentName: string;
  examName: string;
  year: number;
  data?: Record<string, any>;
}

interface DecoratedResult {
  placementScore: number;
  hallTicket: string;
  studentName: string;
  classLabel: string;
  classSlug: string;
  summary: ReturnType<typeof summariseSubjects>;
  photoUrl: string;
  examName: string;
  percentageLabel: string;
}

const PHOTO_KEYS = ["photoUrl", "photoURL", "imageUrl", "profileImage", "avatarUrl", "avatar", "picture", "studentImage"];

export default function RankersCelebration() {
  const { data = [], isLoading } = useResults(undefined, { fetchAll: true });
  const records = (data as ResultRecord[]) ?? [];

  const decorated = useMemo(() => {
    return records
      .map((record) => {
        const rowPayload = (record.data ?? {}) as Record<string, any>;
        const normalized = normalizeResultData({
          data: rowPayload,
          rawRow: rowPayload,
          fallbackYear: record.year,
        });
        const subjectList = Array.isArray(normalized.subjects)
          ? (normalized.subjects as SubjectResult[])
          : inferSubjectsFromRecord(normalized);
        const summary = summariseSubjects(subjectList);
        const classLabel = normalized.className || normalized.class || normalized.grade || "Unknown Class";
        const classSlug = normalized.classSlug || slugifyClass(classLabel);
        const imageCandidate = PHOTO_KEYS.map((key) => normalized[key] as string | undefined).find(
          (value) => typeof value === "string" && value.trim().length,
        );
        return {
          placementScore: summary.totalObtained ?? 0,
          hallTicket: record.rollNo,
          studentName: record.studentName,
          classLabel,
          classSlug,
          summary,
          examName: record.examName,
          percentageLabel: formatPercentage(summary.percentage),
          photoUrl: imageCandidate || FALLBACK_IMAGE,
        } as DecoratedResult;
      })
      .filter((entry) => entry.placementScore > 0)
      .sort((a, b) => b.placementScore - a.placementScore);
  }, [records]);

  const topThree = decorated.slice(0, 3);
  const podiumRankers: Ranker[] = decorated.slice(0, 10).map((entry, index) => ({
    id: index + 1,
    studentName: entry.studentName,
    rank: index + 1,
    year: new Date().getFullYear(),
    score: entry.summary.totalObtained,
    hallTicket: entry.hallTicket,
    className: entry.classLabel,
    examName: entry.examName,
    percentage: Number(entry.summary.percentage.toFixed(2)),
    imageUrl: entry.photoUrl,
    status: 'published',
    source: 'manual',
    manualFields: [],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navigation />
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-slate-950 to-black" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,_rgba(255,215,0,0.18)_0%,_transparent_60%)]" />
          <div className="relative z-10 container mx-auto px-4 space-y-10">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <Badge className="bg-amber-400/20 text-amber-200 text-sm uppercase tracking-[0.5em]">
                Rankers Spotlight
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Celebrating Our Top Performers
              </h1>
              <p className="text-lg text-slate-200">
                Powered entirely by live exam results uploaded via the admin dashboard. Every badge, photo, and score below
                reflects the official data in the shared database.
              </p>
              <div className="flex justify-center">
                <div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 text-sm">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Updated automatically whenever new results are published.
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-amber-300" />
              </div>
            ) : topThree.length < 1 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-xl text-slate-200">No published results yet. Upload records in the admin exam results module.</p>
                <Button variant="secondary" className="mt-6 rounded-full" asChild>
                  <a href="/admin/results">Go to Admin Results</a>
                </Button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-3 items-end">
                {topThree.map((entry, index) => (
                  <CelebrationCard key={entry.hallTicket} entry={entry} placement={(index + 1) as 1 | 2 | 3} />
                ))}
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-slate-200/80">
                Want to verify an individual scorecard? Use the official lookup to view the complete mark sheet in real time.
              </p>
              <Button size="lg" className="rounded-full px-8" asChild>
                <a href="/results">Go to Results Portal</a>
              </Button>
            </div>
          </div>
        </section>

        {!isLoading && podiumRankers.length > 0 && (
          <section className="container mx-auto px-4 pb-20">
            <RankersPodium rankers={podiumRankers} />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function CelebrationCard({ entry, placement }: { entry: DecoratedResult; placement: 1 | 2 | 3 }) {
  const placementStyles: Record<1 | 2 | 3, string> = {
    1: "md:order-2 md:scale-110",
    2: "md:order-1 md:-translate-y-6",
    3: "md:order-3 md:-translate-y-6",
  };
  const badgeColors: Record<1 | 2 | 3, string> = {
    1: "from-amber-400 via-amber-300 to-yellow-200",
    2: "from-slate-300 via-slate-200 to-white",
    3: "from-amber-600 via-orange-500 to-amber-400",
  };

  return (
    <div className={`relative ${placementStyles[placement]}`}>
      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary font-black shadow-xl">
          #{placement}
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 pt-12 text-center shadow-2xl backdrop-blur">
        <div
          className={`mx-auto mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-white/30 bg-gradient-to-br ${badgeColors[placement]}`}
        >
          <img src={entry.photoUrl} alt={entry.studentName} className="h-full w-full object-cover" />
        </div>
        <h2 className="text-2xl font-bold">{entry.studentName}</h2>
        <p className="text-sm uppercase tracking-[0.4em] text-slate-300 mt-1">Hall Ticket {entry.hallTicket}</p>
        <div className="mt-4 flex flex-col gap-2 text-sm">
          <Badge variant="secondary" className="mx-auto bg-white/10 text-white">
            {entry.classLabel}
          </Badge>
          <div className="text-lg font-semibold text-amber-200">
            {entry.summary.totalObtained} / {entry.summary.totalMax} Marks
          </div>
          <p className="text-slate-200">{entry.percentageLabel}  Grade {entry.summary.grade}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs text-slate-200">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Exam</p>
            <p className="text-base font-semibold">{entry.examName}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Status</p>
            <p className="text-base font-semibold text-emerald-300">PASS</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="mt-8 w-full rounded-full bg-white/15 text-white hover:bg-white/25"
          asChild
        >
          <a href={`/results?hallTicket=${encodeURIComponent(entry.hallTicket)}&class=${encodeURIComponent(entry.classSlug)}`}>
            View Detailed Result
          </a>
        </Button>
      </div>
      {placement === 1 && (
        <div className="pointer-events-none absolute inset-x-6 -bottom-4 h-24 rounded-3xl bg-amber-300/10 blur-3xl" />
      )}
    </div>
  );
}
