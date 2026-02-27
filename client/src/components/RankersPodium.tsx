import type { Ranker } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80";

export function RankersPodium({ rankers }: { rankers: Ranker[] }) {
  if (!rankers.length) return null;
  const podium = rankers.slice(0, 3);
  const rest = rankers.slice(3, 10);
  return (
    <section className="bg-slate-950 text-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="px-6 py-10 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-amber-300">Rankers Spotlight</p>
          <h3 className="text-3xl font-bold">Celebrating the Top 10 Achievers</h3>
          <p className="text-sm text-slate-300">Driven directly by live Exam Results from the admin portal.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {podium.map((ranker, index) => (
            <PodiumCard key={ranker.id} ranker={ranker} placement={(index + 1) as 1 | 2 | 3} />
          ))}
        </div>

        {rest.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold">Ranks 4 - 10</h4>
              <span className="text-xs uppercase tracking-[0.5em] text-white/60">Instantly updated</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((ranker) => (
                <div key={ranker.id} className="rounded-2xl bg-white/10 p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">#{ranker.rank}</p>
                      <p className="text-lg font-semibold">{ranker.studentName}</p>
                    </div>
                    <Badge className="bg-amber-300/20 text-amber-200">Class {ranker.className || "—"}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-200">
                    <div>
                      <p className="text-white/50">Hall Ticket</p>
                      <p className="font-semibold">{ranker.hallTicket || "—"}</p>
                    </div>
                    <div>
                      <p className="text-white/50">Marks</p>
                      <p className="font-semibold">{ranker.score}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                    <span>{ranker.percentage ? `${ranker.percentage}%` : "—"}</span>
                    <a
                      href={`/results?hallTicket=${encodeURIComponent(ranker.hallTicket || "")}&class=${encodeURIComponent(
                        ranker.className || "",
                      )}`}
                      className="text-amber-200 hover:text-amber-100"
                    >
                      View Result
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PodiumCard({ ranker, placement }: { ranker: Ranker; placement: 1 | 2 | 3 }) {
  const scaleClass = placement === 1 ? "md:scale-105 md:-translate-y-2" : placement === 2 ? "md:-translate-y-4" : "md:-translate-y-1";
  const accentClass =
    placement === 1
      ? "from-amber-400 via-amber-300 to-yellow-200"
      : placement === 2
        ? "from-slate-100 via-slate-200 to-white"
        : "from-orange-500 via-amber-400 to-yellow-200";

  const photo = ranker.imageUrl || FALLBACK_PHOTO;

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-lg shadow-2xl flex flex-col justify-between",
        scaleClass,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Badge className="bg-white/20 text-white">#{ranker.rank} Ranker</Badge>
          <h4 className="text-2xl font-bold">{ranker.studentName}</h4>
          <p className="text-sm text-white/70">{ranker.className || "Class TBD"}</p>
        </div>
        <div className={cn("w-16 h-16 rounded-full border-4 border-white/60 overflow-hidden", accentClass)}>
          <img src={photo} alt={ranker.studentName} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-white/80">
        <InfoTile label="Hall Ticket" value={ranker.hallTicket || "—"} />
        <InfoTile label="Marks" value={`${ranker.score} Marks`} />
        <InfoTile label="Percentage" value={ranker.percentage ? `${ranker.percentage}%` : "—"} />
        <InfoTile label="Status" value="Pass" />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button className="rounded-full px-5" asChild>
          <a
            href={`/results?hallTicket=${encodeURIComponent(ranker.hallTicket || "")}&class=${encodeURIComponent(
              ranker.className || "",
            )}`}
          >
            View Result
          </a>
        </Button>
        <Button variant="secondary" className="rounded-full px-5 border border-white/40 text-white" asChild>
          <a href="/rankers">Open Celebration Page</a>
        </Button>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
