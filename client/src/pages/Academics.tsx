import { useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useAcademicDocuments,
  AcademicDocFilters,
} from "@/hooks/use-additional-content";
import { CLASS_OPTIONS } from "@/lib/results";
import { Loader2, GraduationCap, FileText, CalendarDays } from "lucide-react";

type DocumentRecord = {
  id: number;
  title: string;
  docType: string;
  subject?: string | null;
  classLevel?: string | null;
  academicYear: string;
  extractedText?: string | null;
  streamUrl: string;
};

export default function Academics() {
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [calendarYear, setCalendarYear] = useState("");
  const [syllabusFilters, setSyllabusFilters] = useState<AcademicDocFilters | null>(null);
  const [calendarFilters, setCalendarFilters] = useState<AcademicDocFilters | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const resourceSectionRef = useRef<HTMLDivElement | null>(null);

  const { data: publishedDocsRaw = [] } = useAcademicDocuments({ status: "published" });
  const publishedDocs = (publishedDocsRaw as DocumentRecord[]) ?? [];
  const {
    data: syllabusDocsRaw = [],
    isFetching: isFetchingSyllabus,
    isError: syllabusError,
  } = useAcademicDocuments(syllabusFilters ?? undefined, { enabled: Boolean(syllabusFilters) });
  const syllabusDocs = (syllabusDocsRaw as DocumentRecord[]) ?? [];

  const {
    data: calendarDocsRaw = [],
    isFetching: isFetchingCalendar,
    isError: calendarFetchError,
  } = useAcademicDocuments(calendarFilters ?? undefined, { enabled: Boolean(calendarFilters) });
  const calendarDocs = (calendarDocsRaw as DocumentRecord[]) ?? [];

  const subjectOptions = useMemo<string[]>(() => {
    const subjects = new Set<string>();
    publishedDocs.forEach((doc) => {
      if (doc.docType !== "syllabus" || !doc.subject) return;
      const trimmed = doc.subject.trim();
      if (trimmed) {
        subjects.add(trimmed);
      }
    });
    return Array.from(subjects).sort((a, b) => a.localeCompare(b));
  }, [publishedDocs]);

  const classOptions = useMemo<string[]>(() => {
    const uploaded = new Set<string>();
    publishedDocs.forEach((doc) => {
      if (doc.docType !== "syllabus" || !doc.classLevel) return;
      const trimmed = doc.classLevel.trim();
      if (trimmed) {
        uploaded.add(trimmed);
      }
    });
    CLASS_OPTIONS.forEach((option) => uploaded.add(option.label));
    return Array.from(uploaded);
  }, [publishedDocs]);

  const yearOptions = useMemo<string[]>(() => {
    const years = new Set<string>();
    publishedDocs.forEach((doc) => {
      const trimmed = doc.academicYear?.trim();
      if (trimmed) {
        years.add(trimmed);
      }
    });
    return Array.from(years).sort().reverse();
  }, [publishedDocs]);

  const noPublishedDocs = publishedDocs.length === 0;

  const handleSyllabusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !classLevel || !academicYear) {
      setFormError("Select subject, class, and academic year to continue.");
      setSyllabusFilters(null);
      return;
    }
    setFormError(null);
    setSyllabusFilters({
      status: "published",
      docType: "syllabus",
      subject,
      classLevel,
      academicYear,
    });
  };

  const handleCalendarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarYear) {
      setCalendarError("Select an academic year to view the calendar.");
      setCalendarFilters(null);
      return;
    }
    setCalendarError(null);
    setCalendarFilters({
      status: "published",
      docType: "calendar",
      academicYear: calendarYear,
    });
  };

  const activeSyllabusDoc: DocumentRecord | undefined = syllabusDocs[0];
  const activeCalendarDoc: DocumentRecord | undefined = calendarDocs[0];

  const jumpToResources = (subjectName: string) => {
    setSubject(subjectName);
    resourceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 space-y-8">
        <section className="text-center max-w-3xl mx-auto space-y-5">
          <GraduationCap className="w-16 h-16 mx-auto text-primary" />
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">Academics Portal</h1>
            <p className="text-lg text-muted-foreground">
              Montessori EM High School follows a comprehensive state-aligned curriculum covering Telugu, Hindi, English, Mathematics,
              Physical Science, Biological Science, and Social Studies. Each subject is delivered through structured lesson
              plans, lab work, and project guides curated by our academic council.
            </p>
            <p className="text-lg text-muted-foreground">
              Use the button below to open the syllabus and academic calendar workspace, download PDFs, and review extracted text
              summaries for quick reference.
            </p>
          </div>
          <Button size="lg" onClick={() => resourceSectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
            Open Syllabus / Calendar
          </Button>
        </section>

        {noPublishedDocs ? (
          <Card className="max-w-3xl mx-auto text-center shadow-lg">
            <CardContent className="py-10 space-y-3">
              <h2 className="text-2xl font-semibold text-primary">Academic resources are coming soon.</h2>
              <p className="text-muted-foreground">
                The admin team has not published any syllabi or academic calendars yet. Please check back later or
                contact the school office for the latest timetable and syllabus booklets.
              </p>
            </CardContent>
          </Card>
        ) : (
        <section ref={resourceSectionRef} id="resources" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Download Syllabus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSyllabusSearch} className="grid grid-cols-1 gap-3">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.length === 0 ? (
                      <SelectItem value="__no_subjects" disabled>
                        No subjects available
                      </SelectItem>
                    ) : (
                      subjectOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select value={classLevel} onValueChange={setClassLevel}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Class / Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.length === 0 ? (
                      <SelectItem value="__no_classes" disabled>
                        No classes available
                      </SelectItem>
                    ) : (
                      classOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.length === 0 ? (
                      <SelectItem value="__no_years" disabled>
                        No years available
                      </SelectItem>
                    ) : (
                      yearOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button type="submit" className="h-12 text-base">
                  {isFetchingSyllabus ? <Loader2 className="h-5 w-5 animate-spin" /> : "Get Syllabus"}
                </Button>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                {syllabusError && (
                  <p className="text-sm text-destructive">Unable to fetch syllabus right now. Please retry.</p>
                )}
              </form>

              {syllabusFilters && (
                <div className="space-y-4">
                  {isFetchingSyllabus && (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                        <p>Fetching the syllabus PDF...</p>
                      </CardContent>
                    </Card>
                  )}

                  {!isFetchingSyllabus && !activeSyllabusDoc && (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center text-muted-foreground">
                        No syllabus found for the selected filters. Please verify the academic year or subject.
                      </CardContent>
                    </Card>
                  )}

                  {activeSyllabusDoc && (
                    <div className="space-y-4">
                      <Card className="shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-lg">
                            <span>{activeSyllabusDoc.title}</span>
                            <Badge variant="outline">{activeSyllabusDoc.academicYear}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm leading-relaxed">
                          <p className="text-muted-foreground text-xs uppercase">
                            {activeSyllabusDoc.classLevel} • {activeSyllabusDoc.subject}
                          </p>
                          <div className="bg-white border rounded-lg p-4 max-h-72 overflow-auto">
                            <p className="whitespace-pre-wrap text-sm text-slate-700">
                              {activeSyllabusDoc.extractedText?.trim() || "This PDF does not provide extractable text."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="border rounded-xl overflow-hidden shadow">
                        <iframe
                          title={activeSyllabusDoc.title}
                          src={activeSyllabusDoc.streamUrl}
                          className="w-full h-[480px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Academic Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCalendarSearch} className="grid grid-cols-1 gap-3">
                <Select value={calendarYear} onValueChange={setCalendarYear}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.length === 0 ? (
                      <SelectItem value="__no_calendar_years" disabled>
                        No years available
                      </SelectItem>
                    ) : (
                      yearOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button type="submit" className="h-12 text-base">
                  {isFetchingCalendar ? <Loader2 className="h-5 w-5 animate-spin" /> : "View Calendar"}
                </Button>
                {calendarError && <p className="text-sm text-destructive">{calendarError}</p>}
                {calendarFetchError && (
                  <p className="text-sm text-destructive">Unable to load calendar right now. Please retry.</p>
                )}
              </form>

              {calendarFilters && (
                <div className="space-y-4">
                  {isFetchingCalendar && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                        <p>Fetching academic calendar...</p>
                      </CardContent>
                    </Card>
                  )}

                  {!isFetchingCalendar && !activeCalendarDoc && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No calendar was published for {calendarYear}.
                      </CardContent>
                    </Card>
                  )}

                  {activeCalendarDoc && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>{activeCalendarDoc.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Academic Year: {activeCalendarDoc.academicYear}
                          </p>
                        </CardContent>
                      </Card>
                      <div className="border rounded-xl overflow-hidden shadow">
                        <iframe
                          title={activeCalendarDoc.title}
                          src={activeCalendarDoc.streamUrl}
                          className="w-full h-[520px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        )}

        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-3">Need help?</h2>
          <p className="text-muted-foreground">
            If you are unable to find your syllabus or calendar, please contact the examinations branch at{" "}
            <a href="mailto:info@montessorihighschool.edu" className="text-primary underline">
              info@montessorihighschool.edu
            </a>{" "}
            with your class, section, and hall-ticket number for faster assistance.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
