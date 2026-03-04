import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResults } from "@/hooks/use-additional-content";
import {
  CLASS_OPTIONS,
  SubjectResult,
  summariseSubjects,
  formatPercentage,
  isSubjectFail,
  normalizeResultData,
  inferSubjectsFromRecord,
  slugifyClass,
} from "@/lib/results";
import { Search, GraduationCap, Loader2, Printer, Share2, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type ResultRecord = {
  id: number;
  rollNo: string;
  studentName: string;
  examName: string;
  year: number;
  status?: string | null;
  data?: Record<string, any>;
};

type ActiveSearch = {
  roll: string;
  klass: string;
};

const CLASS_LABEL_LOOKUP = new Map(CLASS_OPTIONS.map((option) => [option.value, option.label]));
const getClassLabelFromSlug = (slug?: string) => {
  if (!slug) return "";
  return CLASS_LABEL_LOOKUP.get(slug) ?? slug;
};

export default function Results() {
  const [hallTicket, setHallTicket] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [activeSearch, setActiveSearch] = useState<ActiveSearch | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { data: resultPayload = [], isFetching, isError, error } = useResults(
    activeSearch
      ? {
          rollNo: activeSearch.roll,
          className: activeSearch.klass,
        }
      : undefined,
    { fetchAll: false },
  );

  const currentResult: ResultRecord | undefined = resultPayload[0];
  const summary = useMemo(() => getResultSummary(currentResult), [currentResult]);
  const normalizedData = useMemo(() => getNormalizedData(currentResult), [currentResult]);
  const activeClassLabel = activeSearch ? getClassLabelFromSlug(activeSearch.klass) : "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallTicket.trim() || !selectedClass.trim()) {
      setFormError("Enter both hall ticket number and class.");
      setActiveSearch(null);
      return;
    }
    setFormError(null);
    const search = {
      roll: hallTicket.trim().toUpperCase(),
      klass: selectedClass.trim(),
    };
    setActiveSearch(search);
  };

  const resetSearch = () => {
    setHallTicket("");
    setSelectedClass("");
    setFormError(null);
    setActiveSearch(null);
    setLocation("/results", { replace: true });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hall = params.get("hallTicket");
    const klassParam = params.get("class");
    const normalizedClass = klassParam ? slugifyClass(klassParam) : "";
    if (hall) {
      setHallTicket(hall.toUpperCase());
    }
    if (normalizedClass) {
      setSelectedClass(normalizedClass);
    }
    if (hall && normalizedClass) {
      setActiveSearch({ roll: hall.toUpperCase(), klass: normalizedClass });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!activeSearch) {
      window.history.replaceState({}, "", "/results");
      return;
    }
    const params = new URLSearchParams();
    params.set("hallTicket", activeSearch.roll);
    params.set("class", activeSearch.klass);
    window.history.replaceState({}, "", `/results?${params.toString()}`);
  }, [activeSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-16 space-y-8">
        <div className="max-w-3xl mx-auto text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold mb-4">Montessori Results Portal</h1>
          <p className="text-muted-foreground text-lg">
            Enter your hall ticket number and class to view the official scorecard issued by Montessori EM High School.
          </p>
        </div>

        <Card className="max-w-3xl mx-auto shadow-xl">
          <CardContent className="pt-8 space-y-4">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-4">
              <Input
                placeholder="Hall Ticket / Roll Number"
                className="h-12 text-lg"
                value={hallTicket}
                onChange={(e) => setHallTicket(e.target.value.toUpperCase())}
                aria-label="Hall Ticket Number"
              />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="lg" className="h-12 w-full md:w-auto px-8">
                {isFetching && activeSearch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                {isFetching && activeSearch ? "Searching..." : "Get Results"}
              </Button>
            </form>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </CardContent>
        </Card>

        {activeSearch === null && (
          <Card className="max-w-3xl mx-auto border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              Enter your hall ticket and class to fetch the latest published record. All data is served live from the school database.
            </CardContent>
          </Card>
        )}

        {activeSearch !== null && (
          <div className="max-w-5xl mx-auto space-y-6">
            {isFetching && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">
                  Fetching results for {activeSearch.roll} ({activeClassLabel || activeSearch.klass})
                </p>
              </div>
            )}

            {!isFetching && isError && (
              <Card className="border border-dashed text-center p-10">
                <CardContent className="space-y-4">
                  <p className="text-xl font-semibold text-destructive">
                    Unable to load results. {(error as Error)?.message ?? "Please try again later."}
                  </p>
                  <Button variant="outline" onClick={resetSearch}>
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isFetching && !isError && currentResult && summary && normalizedData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <ResultHeader
                  result={currentResult}
                  data={normalizedData}
                  summary={summary}
                  onSearchAnother={resetSearch}
                />
                <SubjectBreakdown subjects={(summary.subjects as SubjectResult[]) || []} />
              </motion.div>
            )}

            {!isFetching && !isError && !currentResult && (
              <Card className="border border-dashed text-center p-10">
                <CardContent className="space-y-4">
                  <p className="text-xl font-semibold text-muted-foreground">
                    No record found for {activeSearch.roll} in class “{activeClassLabel || activeSearch.klass}”.
                  </p>
                  <p className="text-muted-foreground">
                    Verify the hall ticket and class printed on your admit card. Contact the examination branch if the issue persists.
                  </p>
                  <Button variant="outline" onClick={resetSearch}>
                    Search Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ResultHeader({
  result,
  data,
  summary,
  onSearchAnother,
}: {
  result: ResultRecord;
  data: Record<string, any>;
  summary: ReturnType<typeof summariseSubjects>;
  onSearchAnother: () => void;
}) {
  const className = resolvePublicClass(data);
  const section = data.section || data.Section || "—";
  const dob = data.dob ? new Date(data.dob).toLocaleDateString() : "—";
  const academicYear =
    data.academicYear || (typeof result.year === "number" ? `${result.year - 1}-${result.year}` : "—");
  const avatarInitials = result.studentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const badgeTone = summary.overallStatus === "Pass" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700";

  const handlePrint = () => window.print();
  const handleExport = () => exportResultAsCsv(result, summary);

  return (
    <Card className="border-none shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {avatarInitials || <UserRound className="h-8 w-8" />}
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest opacity-90">{result.examName}</p>
              <h2 className="text-3xl font-bold">{result.studentName}</h2>
              <p className="text-primary-foreground/80">Hall Ticket: {result.rollNo}</p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge className={cn("text-sm font-semibold", badgeTone)}>{summary.overallStatus}</Badge>
            <div className="text-lg font-semibold">{formatPercentage(summary.percentage)} • Grade {summary.grade}</div>
            <div className="text-sm opacity-80">{academicYear}</div>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onSearchAnother}>
            Search Another
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Share2 className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoStat label="Class / Section" value={`${className} - ${section}`} />
          <InfoStat label="Date of Birth" value={dob} />
          <InfoStat label="Academic Year" value={academicYear} />
          <InfoStat label="Total Marks" value={`${summary.totalObtained}/${summary.totalMax}`} accent />
          <InfoStat label="Percentage" value={formatPercentage(summary.percentage)} accent />
          <InfoStat label="Grade" value={summary.grade} accent />
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectBreakdown({ subjects }: { subjects: SubjectResult[] }) {
  if (!subjects.length) return null;
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Subject-wise Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground border-b">
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4 text-right">Marks</th>
                <th className="py-2 pr-4 text-right">Max</th>
                <th className="py-2 pr-4 text-right">Grade</th>
                <th className="py-2 pr-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => {
                const failing = isSubjectFail(subject);
                return (
                  <tr
                    key={`${subject.name}-${index}`}
                    className={cn("border-b last:border-none", failing && "bg-rose-50 text-rose-700")}
                  >
                    <td className="py-3 pr-4 font-semibold">{subject.name}</td>
                    <td className="py-3 pr-4 text-right">{subject.marksObtained}</td>
                    <td className="py-3 pr-4 text-right">{subject.maxMarks}</td>
                    <td className="py-3 pr-4 text-right">{subject.grade || "—"}</td>
                    <td className="py-3 pr-4 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-none px-2 py-0.5",
                          failing ? "bg-rose-200 text-rose-900" : "bg-emerald-100 text-emerald-800",
                        )}
                      >
                        {subject.status || (failing ? "Fail" : "Pass")}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoStat({ label, value, accent }: { label: string; value?: string | number | null; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent ? "bg-primary/5 border-primary/20" : "bg-white border-border",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function getResultSummary(result?: ResultRecord) {
  if (!result?.data) return null;
  const normalized = normalizeResultData({
    data: result.data as Record<string, any>,
    fallbackYear: result.year,
  });
  const subjects =
    (Array.isArray(normalized.subjects) ? (normalized.subjects as SubjectResult[]) : undefined) ||
    inferSubjectsFromRecord(normalized);
  return summariseSubjects(subjects);
}

function getNormalizedData(result?: ResultRecord) {
  if (!result?.data) return null;
  return normalizeResultData({
    data: result.data as Record<string, any>,
    fallbackYear: result.year,
  });
}

function exportResultAsCsv(result: ResultRecord, summary: ReturnType<typeof summariseSubjects>) {
  const safeSubjects = summary.subjects;
  const headers = ["Subject", "Marks Obtained", "Max Marks", "Grade", "Status"];
  const rows = safeSubjects.map((subject) => [
    subject.name,
    String(subject.marksObtained),
    String(subject.maxMarks),
    subject.grade ?? "",
    subject.status ?? "",
  ]);
  rows.unshift(headers);
  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.rollNo}-result.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function resolvePublicClass(data?: Record<string, any>) {
  if (!data) return "—";
  const candidate =
    data["className"] ??
    data["class"] ??
    data["Class"] ??
    data["class name"] ??
    data["Class Name"] ??
    data["classSlug"];
  if (typeof candidate === "string" && candidate.trim()) {
    return getClassLabelFromSlug(candidate.trim());
  }
  return "—";
}
