import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResults, useBulkCreateResults, useDeleteResult, useBulkDeleteResults, useUpdateResultsLabel, useUpdateResult } from "@/hooks/use-additional-content";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useSitePreferences, useUpdateSitePreferences } from "@/hooks/use-site-preferences";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SubjectResult,
  CLASS_OPTIONS,
  summariseSubjects,
  formatPercentage,
  isSubjectFail,
  isMetadataSubjectName,
  normalizeResultData,
  inferSubjectsFromRecord,
  slugifyClass,
} from "@/lib/results";
import { Upload, Search, Trash2, Loader2, FileDown, Eye, Plus, Pencil, Check, X, Minus, ArrowRight, ChevronUp } from "lucide-react";

type ResultRecord = {
  id: number;
  rollNo: string;
  studentName: string;
  examName: string;
  year: number;
  status?: string | null;
  data?: Record<string, any>;
};

type ManualFormState = {
  rollNo: string;
  studentName: string;
  photoUrl: string;
  className: string;
  section: string;
  dob: string;
  academicYear: string;
  examName: string;
  year: string;
  overallPassMarks: string;
  overallPassPercentage: string;
};

type SubjectFormRow = {
  id: string;
  name: string;
  maxMarks: string;
  passMarks: string;
  marksObtained: string;
  grade: string;
  status: "Pass" | "Fail";
};

const createSubjectRow = (): SubjectFormRow => ({
  id:
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  name: "",
  maxMarks: "100",
  passMarks: "40",
  marksObtained: "",
  grade: "",
  status: "Pass",
});

const CLASS_LABEL_LOOKUP = new Map(CLASS_OPTIONS.map((option) => [option.value, option.label]));
const getClassLabel = (value?: string) => {
  if (!value) return "";
  return CLASS_LABEL_LOOKUP.get(value) ?? value;
};

const deriveSubjectStatus = (row: SubjectFormRow): SubjectFormRow["status"] => {
  const parsedSubject: SubjectResult = {
    name: row.name,
    maxMarks: Number(row.maxMarks) || 100,
    passMarks: Number(row.passMarks),
    marksObtained: Number(row.marksObtained) || 0,
    grade: row.grade,
    status: undefined,
  };
  const passMarkValue =
    Number.isFinite(parsedSubject.passMarks) && (parsedSubject.passMarks as number) > 0
      ? (parsedSubject.passMarks as number)
      : undefined;
  const evaluated = { ...parsedSubject, passMarks: passMarkValue, status: undefined };
  return isSubjectFail(evaluated) ? "Fail" : "Pass";
};

export default function AdminResults() {
  const [query, setQuery] = useState("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultRecord | null>(null);
  const [lastUploadSummary, setLastUploadSummary] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupLabelDraft, setGroupLabelDraft] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const { data: results = [], isLoading } = useResults();
  const bulkCreate = useBulkCreateResults();
  const deleteResult = useDeleteResult();
  const bulkDeleteResults = useBulkDeleteResults();
  const updateResultsLabel = useUpdateResultsLabel();
  const updateResult = useUpdateResult();
  const { data: sitePrefs, isLoading: isPrefsLoading } = useSitePreferences();
  const updateSitePrefs = useUpdateSitePreferences();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredResults = useMemo(() => {
    if (!query) return results;
    const term = query.toLowerCase();
    return results.filter(
      (row: ResultRecord) =>
        row.rollNo.toLowerCase().includes(term) ||
        row.studentName.toLowerCase().includes(term),
    );
  }, [query, results]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => results.some((row: ResultRecord) => row.id === id)));
  }, [results]);


  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { label: string; rows: ResultRecord[] }>();
    filteredResults.forEach((row) => {
      const label =
        (row.data?.uploadLabel as string | undefined) ||
        (row.data?.sourceSheet as string | undefined) ||
        "Results";
      const batchId =
        (row.data?.uploadBatchId as string | undefined) ||
        (row.data?.sourceSheet as string | undefined) ||
        label;
      if (!groups.has(batchId)) {
        groups.set(batchId, { label, rows: [] });
      }
      groups.get(batchId)!.rows.push(row);
    });
    return Array.from(groups.entries());
  }, [filteredResults]);

  const isUploading = isParsingFile || bulkCreate.isPending;

  const handleDeleteResult = (id: number) => {
    if (!confirm("Delete this result record?")) return;
    setDeletingId(id);
    deleteResult.mutate(id, {
      onSuccess: () => toast({ title: "Result deleted" }),
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Unable to delete result";
        toast({ variant: "destructive", title: "Delete failed", description: message });
      },
      onSettled: () => setDeletingId(null),
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected result${selectedIds.length === 1 ? "" : "s"}?`)) return;
    bulkDeleteResults.mutate(selectedIds, {
      onSuccess: () => {
        toast({ title: "Results deleted", description: `${selectedIds.length} result${selectedIds.length === 1 ? "" : "s"} removed.` });
        setSelectedIds([]);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : "Unable to delete selected results";
        toast({ variant: "destructive", title: "Bulk delete failed", description: message });
      },
    });
  };

  const handleSelectAll = (ids: number[], checked: boolean | "indeterminate") => {
    if (checked) {
      const next = new Set(selectedIds);
      ids.forEach((id) => next.add(id));
      setSelectedIds(Array.from(next));
    } else {
      const visibleSet = new Set(ids);
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    }
  };

  const handleSelectRow = (id: number, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((rowId) => rowId !== id);
    });
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const handleToggleResultsLink = (checked: boolean) => {
    updateSitePrefs.mutate(
      { showResultsInNav: checked },
      {
        onSuccess: () =>
          toast({
            title: checked ? "Results visible" : "Results hidden",
            description: checked
              ? "The Results link now appears in the public site header."
              : "The Results link has been removed from the public header.",
          }),
        onError: (error: Error) =>
          toast({
            variant: "destructive",
            title: "Unable to update preference",
            description: error.message,
          }),
      },
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setLastUploadSummary(null);

    try {
      const parsedData = await parseResultsFile(file);
      await bulkCreate.mutateAsync(parsedData);
      const summary = `${parsedData.length} result${parsedData.length === 1 ? "" : "s"} uploaded`;
      setLastUploadSummary(summary);
      toast({ title: "Upload complete", description: `${summary} from ${file.name}.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process the uploaded file.";
      toast({ variant: "destructive", title: "Upload failed", description: message });
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Exam Results</h2>
            <p className="text-muted-foreground">
              Upload CSV/Excel exports or add results manually. Every record instantly powers the public result lookup page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Button onClick={openFileDialog} disabled={isUploading} className="gap-2 w-full sm:w-auto">
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading..." : "Upload File"}
            </Button>
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={() => {
                const sample = [
                  "rollNo,studentName,examName,year,class,section,subjects_json",
                  '"A101","Anita Rao","English Medium Board","2024","10","A","[{""name"":""Maths"",""maxMarks"":100,""marksObtained"":95,""grade"":""A+"",""status"":""Pass""}]"',
                ].join("\n");
                navigator.clipboard
                  .writeText(sample)
                  .then(() => toast({ title: "Sample copied", description: "CSV template copied to clipboard." }))
                  .catch(() => toast({ variant: "destructive", title: "Unable to copy sample" }));
              }}
            >
              <FileDown className="w-4 h-4" />
              Copy Sample
            </Button>
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary/90 hover:bg-primary w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Manual Entry
                </Button>
              </DialogTrigger>
              <ManualResultDialog
                isSubmitting={bulkCreate.isPending}
                onSubmit={async (payload) => {
                  await bulkCreate.mutateAsync([payload]);
                  toast({ title: "Result added", description: `${payload.studentName} saved successfully.` });
                  setManualOpen(false);
                }}
              />
            </Dialog>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              {editingResult && (
                <ManualResultDialog
                  title="Edit Result"
                  isSubmitting={updateResult.isPending}
                  initialResult={editingResult}
                  onSubmit={async (payload) => {
                    try {
                      await updateResult.mutateAsync({ id: editingResult.id, payload });
                      toast({ title: "Result updated", description: `${payload.studentName} updated successfully.` });
                      setEditOpen(false);
                      setEditingResult(null);
                    } catch (err) {
                      const message = err instanceof Error ? err.message : "Unable to update result";
                      toast({ variant: "destructive", title: "Update failed", description: message });
                    }
                  }}
                />
              )}
            </Dialog>
          </div>
        </div>

        <Card className="border border-slate-100 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Results Link Visibility</CardTitle>
              <p className="text-sm text-muted-foreground">
                Toggle whether the public navigation bar should display the Results page link.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                {sitePrefs?.showResultsInNav ? "Visible" : "Hidden"}
              </span>
              <Switch
                id="results-nav-toggle"
                checked={sitePrefs?.showResultsInNav ?? true}
                disabled={isPrefsLoading || updateSitePrefs.isPending}
                onCheckedChange={handleToggleResultsLink}
                aria-label="Toggle Results link visibility"
              />
            </div>
          </CardHeader>
        </Card>

        <div className="text-sm text-muted-foreground bg-white border rounded-md p-4 shadow-sm space-y-2">
          <p className="font-medium text-foreground">Template requirements</p>
          <p>
            Required columns: <code className="rounded bg-slate-100 px-2 py-0.5">hall ticket, student name, class, year</code>. Provide
            subject details either as repeated columns (<code>Subject 1 Name</code>, <code>Subject 1 Marks</code>, etc.) or a{" "}
            <code>subjects_json</code> column with an array. Any extra columns are kept verbatim for the public view.
          </p>
          {lastUploadSummary && <p className="text-emerald-600">{lastUploadSummary}</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Manage Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Search by roll number or student name"
                  className="pl-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {query && (
                  <Button variant="ghost" onClick={() => setQuery("")} className="w-full sm:w-auto">
                    Clear
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="gap-2 w-full sm:w-auto"
                  disabled={selectedIds.length === 0 || bulkDeleteResults.isPending}
                  onClick={handleBulkDelete}
                >
                  {bulkDeleteResults.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="py-10">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {query
                  ? `No results found for "${query}".`
                  : "No results uploaded yet. Use the uploader or manual entry button to add the first record."}
              </div>
            ) : (
              groupedResults.map(([groupId, group]) => {
                const groupLabel = group.label;
                const groupRows = group.rows;
                const groupIds = groupRows.map((row) => row.id);
                const allSelected = groupIds.length > 0 && groupIds.every((id) => selectedSet.has(id));
                const someSelected = groupIds.some((id) => selectedSet.has(id));
                const isEditing = editingGroup === groupId;
                const isOpen = openGroups.includes(groupId);
                const classNames = Array.from(
                  new Set(
                    groupRows
                      .map((row) => resolveClassDisplay(row.data))
                      .filter((value) => value && value !== "—"),
                  ),
                );
                const years = Array.from(
                  new Set(
                    groupRows
                      .map((row) => row.data?.academicYear || row.year?.toString())
                      .filter(Boolean) as string[],
                  ),
                );
                return (
                  <Card key={groupId} className="border border-slate-200 shadow-sm">
                    <CardHeader className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          {isEditing ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                value={groupLabelDraft}
                                onChange={(event) => setGroupLabelDraft(event.target.value)}
                                className="h-9 max-w-xs"
                              />
                              <Button
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                  const nextLabel = groupLabelDraft.trim();
                                  if (!nextLabel) {
                                    toast({ variant: "destructive", title: "Enter a valid label" });
                                    return;
                                  }
                                  updateResultsLabel.mutate(
                                    { ids: groupIds, label: nextLabel },
                                    {
                                      onSuccess: () => {
                                        toast({ title: "Label updated" });
                                        setEditingGroup(null);
                                      },
                                      onError: (err) => {
                                        const message = err instanceof Error ? err.message : "Unable to update label";
                                        toast({ variant: "destructive", title: "Rename failed", description: message });
                                      },
                                    },
                                  );
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => setEditingGroup(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold">{groupLabel}</p>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingGroup(groupId);
                                  setGroupLabelDraft(groupLabel);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {classNames.length > 0 && <span>Class: {classNames.join(", ")}</span>}
                            {years.length > 0 && <span>Year: {years.join(", ")}</span>}
                            <span>{groupRows.length} student(s)</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="gap-2 text-primary"
                          onClick={() => {
                            setOpenGroups((prev) =>
                              prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
                            );
                          }}
                        >
                          {isOpen ? (
                            <>
                              Hide <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Open <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="space-y-3">
                        <div className="w-full overflow-x-auto">
                        <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allSelected ? true : someSelected ? "indeterminate" : false}
                              onCheckedChange={(checked) => handleSelectAll(groupIds, checked)}
                              aria-label={`Select all results for ${groupLabel}`}
                            />
                          </TableHead>
                          <TableHead>Hall Ticket</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Exam</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupRows.map((result: ResultRecord) => {
                          const classLabel = resolveClassDisplay(result.data);
                          const classSlug =
                            (result.data?.["classSlug"] as string | undefined) || slugifyClass(classLabel);
                          return (
                            <TableRow key={result.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedSet.has(result.id)}
                                  onCheckedChange={(checked) => handleSelectRow(result.id, checked)}
                                  aria-label={`Select result ${result.rollNo}`}
                                />
                              </TableCell>
                              <TableCell className="font-semibold">{result.rollNo}</TableCell>
                              <TableCell>{result.studentName}</TableCell>
                              <TableCell>{classLabel}</TableCell>
                              <TableCell>{result.examName}</TableCell>
                              <TableCell>{result.year}</TableCell>
                              <TableCell>
                                <StatusBadge status={result.data?.resultStatus || result.status} />
                              </TableCell>
                              <TableCell>
                                <ResultSummary data={result.data} />
                              </TableCell>
                              <TableCell className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:bg-primary/10"
                                  title="Edit result"
                                  onClick={() => {
                                    setEditingResult(result);
                                    setEditOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="text-primary hover:bg-primary/10"
                                  title="View public page"
                                >
                                  <Link
                                    href={`/results?hallTicket=${encodeURIComponent(
                                      result.rollNo,
                                    )}&class=${encodeURIComponent(classSlug)}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "text-destructive hover:text-destructive hover:bg-destructive/10",
                                    (deletingId === result.id || bulkDeleteResults.isPending) && "opacity-50",
                                  )}
                                  onClick={() => handleDeleteResult(result.id)}
                                  disabled={deletingId === result.id || bulkDeleteResults.isPending}
                                >
                                  {deletingId === result.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                        </Table>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ManualResultDialog({
  onSubmit,
  isSubmitting,
  initialResult,
  title,
}: {
  onSubmit: (payload: any) => Promise<void>;
  isSubmitting: boolean;
  initialResult?: ResultRecord | null;
  title?: string;
}) {
  const [form, setForm] = useState<ManualFormState>({
    rollNo: "",
    studentName: "",
    photoUrl: "",
    className: CLASS_OPTIONS[0]?.value || "",
    section: "",
    dob: "",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    examName: "English Medium Board",
    year: String(new Date().getFullYear()),
    overallPassMarks: "",
    overallPassPercentage: "40",
  });
  const [subjects, setSubjects] = useState<SubjectFormRow[]>([createSubjectRow()]);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialResult) return;
    const data = (initialResult.data ?? {}) as Record<string, any>;
    const classLabel = resolveClassDisplay(data) || data.className || data.class || "";
    const classSlug = (data.classSlug as string | undefined) || slugifyClass(classLabel);
    const academicYear =
      (data.academicYear as string | undefined) ||
      (typeof initialResult.year === "number" ? `${initialResult.year - 1}-${initialResult.year}` : "");
    const subjectRows = (Array.isArray(data.subjects) ? (data.subjects as SubjectResult[]) : inferSubjectsFromRecord(data))
      .filter((subject) => subject && subject.name && !isMetadataSubjectName(subject.name))
      .map((subject) => ({
        id:
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
        name: subject.name,
        maxMarks: String(subject.maxMarks ?? 100),
        passMarks: String(subject.passMarks ?? 40),
        marksObtained: String(subject.marksObtained ?? ""),
        grade: subject.grade || "",
        status: (subject.status as SubjectFormRow["status"]) || (isSubjectFail(subject) ? "Fail" : "Pass"),
      }));
    const overallPassMarks = Number(data.overallPassMarks);
    const normalizedOverallPassMarks = Number.isFinite(overallPassMarks) ? String(overallPassMarks) : "";
    setForm({
      rollNo: initialResult.rollNo || "",
      studentName: initialResult.studentName || "",
      photoUrl: (data.photoUrl as string | undefined) || "",
      className: classSlug || CLASS_OPTIONS[0]?.value || "",
      section: (data.section as string | undefined) || "",
      dob: (data.dob as string | undefined) || "",
      academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      examName: initialResult.examName || (data.examName as string | undefined) || "English Medium Board",
      year: String(initialResult.year || new Date().getFullYear()),
      overallPassMarks: normalizedOverallPassMarks,
      overallPassPercentage: String(data.overallPassPercentage ?? 40),
    });
    setSubjects(subjectRows.length ? subjectRows : [createSubjectRow()]);
  }, [initialResult]);

  const updateSubject = (id: string, key: keyof SubjectFormRow, value: string) => {
    setSubjects((prev) =>
      prev.map((subject) => {
        if (subject.id !== id) return subject;
        const next = { ...subject, [key]: value } as SubjectFormRow;
        next.status = deriveSubjectStatus(next);
        return next;
      }),
    );
  };

  const handleAddSubject = () => {
    setSubjects((prev) => [...prev, createSubjectRow()]);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects((prev) => (prev.length === 1 ? prev : prev.filter((subject) => subject.id !== id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSubjects: SubjectResult[] = subjects
      .filter((subject) => subject.name && subject.marksObtained !== "")
      .map((subject) => ({
        name: subject.name,
        maxMarks: Number(subject.maxMarks) || 100,
        passMarks: Number(subject.passMarks),
        marksObtained: Number(subject.marksObtained) || 0,
        grade: subject.grade,
        status: subject.status,
      }));

    if (parsedSubjects.length === 0) {
      toast({ variant: "destructive", title: "Add at least one subject" });
      return;
    }

    const validatedSubjects: SubjectResult[] = [];
    for (const subject of parsedSubjects) {
      const passMarkValue =
        Number.isFinite(subject.passMarks) && (subject.passMarks as number) > 0 ? (subject.passMarks as number) : undefined;
      if (Number.isFinite(passMarkValue) && passMarkValue! > subject.maxMarks) {
        toast({
          variant: "destructive",
          title: "Invalid pass mark",
          description: `Pass marks for ${subject.name} cannot exceed max marks.`,
        });
        return;
      }
      const checkSubject: SubjectResult = {
        ...subject,
        passMarks: passMarkValue,
        status: undefined,
      };
      const isFailing = isSubjectFail(checkSubject);
      validatedSubjects.push({ ...checkSubject, status: isFailing ? "Fail" : "Pass" });
    }

    const overallPassMarks = Number(form.overallPassMarks);
    const overallPassPercentage = Number(form.overallPassPercentage) || 40;
    const totalMax = validatedSubjects.reduce((acc, subject) => acc + (subject.maxMarks || 0), 0);
    const derivedPassMarksTotal = validatedSubjects.reduce(
      (acc, subject) => acc + (Number.isFinite(subject.passMarks) ? (subject.passMarks as number) : 0),
      0,
    );
    const effectiveOverallPassMarks =
      Number.isFinite(overallPassMarks) && overallPassMarks > 0
        ? overallPassMarks
        : derivedPassMarksTotal > 0
          ? derivedPassMarksTotal
          : undefined;

    if (Number.isFinite(effectiveOverallPassMarks) && effectiveOverallPassMarks > totalMax) {
      toast({
        variant: "destructive",
        title: "Overall pass marks too high",
        description: "Overall pass marks cannot exceed total max marks.",
      });
      return;
    }
    const summary = summariseSubjects(validatedSubjects, {
      overallPassMarks: effectiveOverallPassMarks,
      overallPassPercentage,
    });
    const photoUrl = form.photoUrl.trim();
    const classLabel = getClassLabel(form.className);
    const slugValue = form.className || slugifyClass(classLabel);

    const normalizedData = normalizeResultData({
      rawRow: {
        rollNo: form.rollNo,
        studentName: form.studentName,
        photoUrl: photoUrl || undefined,
        className: classLabel,
        classSlug: slugValue,
        section: form.section,
        dob: form.dob,
        academicYear: form.academicYear,
        examName: form.examName,
        year: form.year,
      },
      data: {
        className: classLabel,
        classSlug: slugValue,
        section: form.section,
        dob: form.dob,
        academicYear: form.academicYear,
        subjects: summary.subjects,
        resultStatus: summary.overallStatus,
        overallPassMarks: effectiveOverallPassMarks,
        overallPassPercentage,
        photoUrl: photoUrl || undefined,
      },
      fallbackClass: classLabel,
      fallbackYear: Number(form.year) || new Date().getFullYear(),
    });

    const payload = {
      rollNo: form.rollNo.trim(),
      studentName: form.studentName.trim(),
      examName: form.examName.trim(),
      year: Number(form.year) || new Date().getFullYear(),
      status: "published",
      data: normalizedData,
    };

    await onSubmit(payload);
    setForm((prev) => ({ ...prev, rollNo: "", studentName: "", photoUrl: "" }));
    setSubjects([createSubjectRow()]);
  };

  return (
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>{title || "Add Result Manually"}</DialogTitle>
        <DialogDescription>Complete the student details and subjects to publish a result immediately.</DialogDescription>
      </DialogHeader>
      <form className="space-y-4 max-h-[70vh] overflow-auto pr-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hall Ticket Number" required>
              <Input required value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
            </Field>
            <Field label="Student Name" required>
              <Input required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
            </Field>
            <Field label="Profile Photo URL">
              <Input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://example.com/student.jpg"
              />
            </Field>
            <Field label="Class" required>
              <Select value={form.className} onValueChange={(value) => setForm({ ...form, className: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section">
              <Input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Academic Year" required>
              <Input required value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} />
            </Field>
            <Field label="Exam Name" required>
              <Input required value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} />
            </Field>
            <Field label="Exam Year" required>
              <Input required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </Field>
            <Field label="Overall Pass Marks">
              <Input
                type="number"
                min="0"
                value={form.overallPassMarks}
                onChange={(e) => setForm({ ...form, overallPassMarks: e.target.value })}
                placeholder="Leave blank to auto-calc from subject pass marks"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Subjects</p>
              <Button type="button" size="sm" variant="outline" onClick={handleAddSubject} className="gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </div>
            <div className="space-y-3">
              {subjects.map((subject, index) => (
                <div key={subject.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-lg border p-3">
                  <Field label={`Subject ${index + 1}`} required>
                    <Input value={subject.name} onChange={(e) => updateSubject(subject.id, "name", e.target.value)} required />
                  </Field>
                  <Field label="Max Marks" required>
                    <Input
                      type="number"
                      min="0"
                      value={subject.maxMarks}
                      onChange={(e) => updateSubject(subject.id, "maxMarks", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Pass Marks" required>
                    <Input
                      type="number"
                      min="0"
                      value={subject.passMarks}
                      onChange={(e) => updateSubject(subject.id, "passMarks", e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value.trim() === "") {
                          updateSubject(subject.id, "passMarks", "0");
                        }
                      }}
                      required
                    />
                  </Field>
                  <Field label="Marks Obtained" required>
                    <Input
                      type="number"
                      min="0"
                      value={subject.marksObtained}
                      onChange={(e) => updateSubject(subject.id, "marksObtained", e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value.trim() === "") {
                          updateSubject(subject.id, "marksObtained", "0");
                        }
                      }}
                      required
                    />
                  </Field>
                  <Field label="Grade">
                    <Input value={subject.grade} onChange={(e) => updateSubject(subject.id, "grade", e.target.value)} />
                  </Field>
                  <Field label="Status">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-none px-3 py-1 text-xs font-semibold w-fit",
                        subject.status === "Pass" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {subject.status}
                    </Badge>
                  </Field>
                  {subjects.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="justify-self-end text-destructive"
                      onClick={() => handleRemoveSubject(subject.id)}
                    >
                      <Minus className="w-4 h-4" />
                      <span className="sr-only">Remove subject</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Result
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ResultSummary({ data }: { data?: Record<string, any> }) {
  const record = (data as Record<string, any>) || {};
  const subjects =
    (Array.isArray(record?.subjects) ? (record.subjects as SubjectResult[]) : undefined) ||
    inferSubjectsFromRecord(record);
  const summary = summariseSubjects(subjects, getSummaryOptions(record));
  const className = resolveClassDisplay(record);
  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium">{className}</div>
      <div className="text-muted-foreground">
        {formatPercentage(summary.percentage)} · {summary.grade}
      </div>
    </div>
  );
}

function getSummaryOptions(record?: Record<string, any>) {
  const overallPassMarks = Number(record?.overallPassMarks);
  const overallPassPercentage = Number(record?.overallPassPercentage);
  return {
    overallPassMarks: Number.isFinite(overallPassMarks) && overallPassMarks > 0 ? overallPassMarks : undefined,
    overallPassPercentage: Number.isFinite(overallPassPercentage) ? overallPassPercentage : undefined,
  };
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status?.toLowerCase();
  const isPass = normalized === "pass" || normalized === "published";
  const label = status ? status.toUpperCase() : "PENDING";
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-none px-3 py-1 text-xs font-semibold",
        isPass ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
      )}
    >
      {label}
    </Badge>
  );
}

function resolveClassDisplay(data?: Record<string, any>) {
  if (!data) return "—";
  const candidate =
    data["className"] ??
    data["class"] ??
    data["Class"] ??
    data["class name"] ??
    data["Class Name"] ??
    data["classSlug"];
  if (typeof candidate === "string" && candidate.trim()) {
    return getClassLabel(candidate.trim());
  }
  return "—";
}

async function parseResultsFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "csv") {
    const text = await file.text();
    const batchId = createUploadBatchId();
    return parseCsvText(text, {
      sourceLabel: file.name.replace(/\.[^.]+$/, ""),
      sourceWorkbook: file.name.replace(/\.[^.]+$/, ""),
      batchId,
    });
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetNames = workbook.SheetNames;
    if (!sheetNames.length) {
      throw new Error("This workbook does not contain any sheets.");
    }
    const workbookLabel = file.name.replace(/\.[^.]+$/, "");
    const results: any[] = [];
    sheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      const csvText = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      if (!csvText.trim()) return;
      const batchId = createUploadBatchId();
      const sourceLabel =
        sheetNames.length > 1 ? `${workbookLabel} - ${sheetName}` : workbookLabel;
      const parsed = parseCsvText(csvText, {
        sourceLabel,
        sourceSheet: sheetName,
        sourceWorkbook: workbookLabel,
        batchId,
      });
      results.push(...parsed);
    });
    if (results.length === 0) {
      throw new Error("No valid rows found in this workbook.");
    }
    return results;
  }

  throw new Error("Please upload a .csv, .xls, or .xlsx file.");
}

function createUploadBatchId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseCsvText(
  text: string,
  context?: { sourceLabel?: string; sourceSheet?: string; sourceWorkbook?: string; batchId?: string },
) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rows.length < 2) {
    throw new Error("CSV must include a header row plus at least one result row.");
  }

  const headerRow = splitCsvLine(rows[0]);
  const headers = headerRow.map((header, idx) => header?.trim() || `Column ${idx + 1}`);

  const payload: any[] = [];

  rows.slice(1).forEach((line, idx) => {
    const values = splitCsvLine(line).map((value) => value.trim());
    if (values.every((value) => value === "")) return;

    const rowMap: Record<string, string> = {};
    values.forEach((value, columnIndex) => {
      rowMap[headers[columnIndex]] = value;
    });

    const rollNo = rowMap["rollNo"] || rowMap["RollNo"] || rowMap["Hall Ticket"] || `ROW-${idx + 2}`;
    const studentName = rowMap["studentName"] || rowMap["Student"] || rowMap["Student Name"] || "Student";
    const examName = rowMap["examName"] || rowMap["Exam"] || "Exam";
    const year = Number(rowMap["year"] || rowMap["Year"]) || new Date().getFullYear();

    payload.push(buildStructuredPayload(rowMap, rollNo, studentName, examName, year, context));
  });

  if (payload.length === 0) {
    throw new Error("No valid rows found in CSV.");
  }

  return payload;
}

function buildStructuredPayload(
  rowRecord: Record<string, string>,
  rollNo: string,
  studentName: string,
  examName: string,
  year: number,
  context?: { sourceLabel?: string; sourceSheet?: string; sourceWorkbook?: string; batchId?: string },
) {
  const sanitizedRow = sanitizeRowRecord(rowRecord);
  const classRaw = extractValue(sanitizedRow, ["class", "className", "standard", "grade"]);
  const className = classRaw || sanitizedRow["className"] || sanitizedRow["Class"] || "";
  const section = extractValue(sanitizedRow, ["section", "sec"]);
  const dob = extractValue(sanitizedRow, ["dob", "date of birth"]);
  const academicYear = extractValue(sanitizedRow, ["academicYear", "session", "schoolYear"]);
  const resultStatus = extractValue(sanitizedRow, ["status", "resultStatus", "result"]);
  const photoUrl = extractValue(sanitizedRow, ["photoUrl", "photoURL", "imageUrl", "profileImage", "avatar", "photo"]);

  const subjects = inferSubjectsFromRecord({
    ...sanitizedRow,
    className,
  });

  const normalizedData = normalizeResultData({
    rawRow: sanitizedRow,
    data: {
      className,
      classSlug: slugifyClass(className || sanitizedRow["classSlug"]),
      section,
      dob,
      academicYear,
      resultStatus,
      subjects,
      photoUrl: photoUrl || sanitizedRow["photoUrl"],
      uploadLabel: context?.sourceLabel,
      sourceSheet: context?.sourceSheet,
      sourceWorkbook: context?.sourceWorkbook,
      uploadBatchId: context?.batchId,
    },
    fallbackClass: className,
    fallbackYear: year,
  });

  return {
    rollNo: rollNo.trim(),
    studentName: studentName.trim(),
    examName: examName.trim(),
    year,
    status: "published",
    data: normalizedData,
  };
}

function sanitizeRowRecord(record: Record<string, string>) {
  const sanitized: Record<string, string> = {};
  Object.entries(record).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    sanitized[key] = typeof value === "string" ? value.trim() : String(value);
  });
  return sanitized;
}


function extractValue(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const direct = record[key];
    if (direct) return direct;
    const altKey = Object.keys(record).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (altKey && record[altKey]) return record[altKey];
  }
  return "";
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}
