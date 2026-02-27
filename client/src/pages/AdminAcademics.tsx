import { useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  useAcademicDocuments,
  useUploadAcademicDocument,
  useDeleteAcademicDocument,
  useUpdateAcademicDocStatus,
} from "@/hooks/use-additional-content";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/results";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Eye, Trash2, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentRecord = {
  id: number;
  title: string;
  docType: string;
  subject?: string | null;
  classLevel?: string | null;
  academicYear: string;
  status: "draft" | "published";
  uploadedAt?: string;
  streamUrl: string;
  extractedText?: string | null;
  fileUrl?: string;
  fileSize?: number | null;
};

const DOC_TYPES = [
  { label: "Syllabus (per subject/class)", value: "syllabus" },
  { label: "Academic Calendar", value: "calendar" },
];

const ALL_OPTION = "__all__";

const DEFAULT_FORM = {
  title: "",
  docType: "syllabus",
  academicYear: "",
  classLevel: "",
  subject: "",
  status: true,
};

export default function AdminAcademics() {
  const { data: documentPayload = [], isLoading } = useAcademicDocuments();
  const documents = (documentPayload as DocumentRecord[]) ?? [];
  const uploadMutation = useUploadAcademicDocument();
  const deleteMutation = useDeleteAcademicDocument();
  const statusMutation = useUpdateAcademicDocStatus();
  const { toast } = useToast();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);
  const [filters, setFilters] = useState({
    docType: "",
    academicYear: "",
    classLevel: "",
    subject: "",
  });

  const filteredDocs = useMemo(() => {
    return documents.filter((doc: DocumentRecord) => {
      if (filters.docType && doc.docType !== filters.docType) return false;
      if (filters.academicYear && doc.academicYear !== filters.academicYear) return false;
      if (filters.classLevel && (doc.classLevel || "") !== filters.classLevel) return false;
      if (filters.subject && (doc.subject || "") !== filters.subject) return false;
      return true;
    });
  }, [documents, filters]);

  const uniqueYears = useMemo<string[]>(() => {
    return Array.from(new Set<string>(documents.map((doc) => doc.academicYear).filter(Boolean)));
  }, [documents]);

  const uniqueSubjects = useMemo<string[]>(() => {
    return Array.from(
      new Set<string>(
        documents.filter((doc) => doc.subject).map((doc) => doc.subject as string),
      ),
    );
  }, [documents]);

  const classOptions = useMemo<string[]>(() => {
    const uploadedClasses = new Set<string>(
      documents.filter((doc) => doc.classLevel).map((doc) => doc.classLevel as string),
    );
    CLASS_OPTIONS.forEach((option) => uploadedClasses.add(option.label));
    return Array.from(uploadedClasses);
  }, [documents]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ variant: "destructive", title: "Select a PDF file to upload." });
      return;
    }
    if (form.docType === "syllabus" && (!form.subject || !form.classLevel || !form.academicYear)) {
      toast({
        variant: "destructive",
        title: "Syllabus uploads require subject, class, and academic year.",
      });
      return;
    }
    const payload = new FormData();
    payload.append("title", form.title.trim() || file.name.replace(".pdf", ""));
    payload.append("docType", form.docType);
    payload.append("academicYear", form.academicYear.trim());
    if (form.subject) payload.append("subject", form.subject.trim());
    if (form.classLevel) payload.append("classLevel", form.classLevel.trim());
    payload.append("status", form.status ? "published" : "draft");
    payload.append("file", file);

    try {
      await uploadMutation.mutateAsync(payload);
      toast({ title: "Document uploaded successfully." });
      setForm(DEFAULT_FORM);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      toast({ variant: "destructive", title: message });
    }
  };

  const handleDelete = (doc: DocumentRecord) => {
    if (!confirm(`Delete ${doc.title}? This cannot be undone.`)) return;
    deleteMutation.mutate(doc.id, {
      onSuccess: () => toast({ title: "Document deleted." }),
      onError: (error) =>
        toast({
          variant: "destructive",
          title: error instanceof Error ? error.message : "Failed to delete document",
        }),
    });
  };

  const toggleStatus = (doc: DocumentRecord) => {
    const newStatus = doc.status === "published" ? "draft" : "published";
    statusMutation.mutate(
      { id: doc.id, status: newStatus },
      {
        onSuccess: () =>
          toast({
            title: `Marked as ${newStatus}.`,
          }),
        onError: (error) =>
          toast({
            variant: "destructive",
            title: error instanceof Error ? error.message : "Unable to update status",
          }),
      },
    );
  };

  const openViewer = (doc: DocumentRecord) => {
    setActiveDoc(doc);
    setViewerOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Academics Library</h1>
            <p className="text-muted-foreground">
              Upload syllabus PDFs and academic calendars. Extracted text becomes searchable and powers the public site instantly.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Display Title" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="E.g., Grade 10 Mathematics Syllabus"
                  required
                />
              </Field>

              <Field label="Document Type" required>
                <Select
                  value={form.docType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, docType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Academic Year" required>
                <Input
                  value={form.academicYear}
                  onChange={(e) => setForm((prev) => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2025-26"
                  required
                />
              </Field>

              <Field label="Class / Grade">
                <Select
                  value={form.classLevel}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, classLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Subject">
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Mathematics"
                  disabled={form.docType === "calendar"}
                  required={form.docType === "syllabus"}
                />
              </Field>

              <Field label="Publish Immediately?">
                <div className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Switch
                    id="publish-toggle"
                    checked={form.status}
                    onCheckedChange={(checked) => setForm((prev) => ({ ...prev, status: checked }))}
                  />
                  <Label htmlFor="publish-toggle" className="text-sm font-medium">
                    {form.status ? "Published" : "Draft"}
                  </Label>
                </div>
              </Field>

              <Field label="PDF File" required className="md:col-span-2">
                <Input
                  ref={fileInputRef}
                  id="academic-file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only PDF files are allowed. Text will be extracted automatically once uploaded.
                </p>
              </Field>

              <div className="md:col-span-2 flex items-center justify-end gap-4">
                <Button type="submit" className="gap-2" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Upload &amp; Extract
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Manage Documents
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select
                value={filters.docType || ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, docType: value === ALL_OPTION ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All Types</SelectItem>
                  {DOC_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.academicYear || ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, academicYear: value === ALL_OPTION ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All Years</SelectItem>
                  {uniqueYears.length === 0 ? (
                    <SelectItem value="__no_years" disabled>
                      No years yet
                    </SelectItem>
                  ) : (
                    uniqueYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select
                value={filters.classLevel || ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, classLevel: value === ALL_OPTION ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All Classes</SelectItem>
                  {classOptions.length === 0 ? (
                    <SelectItem value="__no_classes" disabled>
                      No classes yet
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

              <Select
                value={filters.subject || ALL_OPTION}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, subject: value === ALL_OPTION ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>All Subjects</SelectItem>
                  {uniqueSubjects.length === 0 ? (
                    <SelectItem value="__no_subjects" disabled>
                      No subjects yet
                    </SelectItem>
                  ) : (
                    uniqueSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No documents found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc: DocumentRecord) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-semibold">{doc.title}</TableCell>
                      <TableCell className="capitalize">{doc.docType}</TableCell>
                      <TableCell>{doc.academicYear}</TableCell>
                      <TableCell>{doc.classLevel || "—"}</TableCell>
                      <TableCell>{doc.subject || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs font-semibold border-none",
                            doc.status === "published"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700",
                          )}
                        >
                          {doc.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openViewer(doc)} title="View PDF">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(doc)}
                            title="Toggle publish status"
                            disabled={statusMutation.isPending}
                          >
                            {doc.status === "published" ? <FileText className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc)}
                            className="text-destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{activeDoc?.title}</DialogTitle>
            </DialogHeader>
            {activeDoc && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    title={activeDoc.title}
                    src={activeDoc.streamUrl}
                    className="w-full h-[420px]"
                  />
                </div>
                <div className="border rounded-lg p-3 bg-slate-50">
                  <h4 className="text-sm font-semibold mb-2">Extracted Text</h4>
                  <ScrollArea className="h-[380px]">
                    <pre className="whitespace-pre-wrap text-xs text-slate-700">
                      {activeDoc.extractedText?.trim() || "No extractable text detected in this PDF."}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
