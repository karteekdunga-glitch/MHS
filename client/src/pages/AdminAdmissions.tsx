import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Filter, Plus, MoreHorizontal, Eye, Trash, RefreshCw } from "lucide-react";
import {
  useAdmissions,
  useCreateAdmissionRecord,
  useUpdateAdmissionStatus,
  useDeleteAdmission,
  useUpdateAdmissionRecord,
} from "@/hooks/use-additional-content";
import { useToast } from "@/hooks/use-toast";
import { CLASS_OPTIONS } from "@/lib/results";
import {
  ADMISSION_STATUSES,
  STATUS_ACTIONS,
  ADMISSION_STATUS_META,
  type AdmissionRecord,
  type AdmissionStatus,
} from "@/types/admissions";
import { cn } from "@/lib/utils";

const manualAdmissionSchema = z.object({
  studentName: z.string().min(2),
  parentName: z.string().min(2),
  classApplyingFor: z.string().min(1),
  academicYear: z.string().min(4),
  dob: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email(),
  address: z.string().min(5),
  previousSchool: z.string().optional(),
  message: z.string().optional(),
  status: z.enum(ADMISSION_STATUSES),
  expectedJoinDate: z.string().optional(),
});

type ManualAdmissionForm = z.infer<typeof manualAdmissionSchema>;

const defaultManualValues: ManualAdmissionForm = {
  studentName: "",
  parentName: "",
  classApplyingFor: "",
  academicYear: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  previousSchool: "",
  message: "",
  status: "new",
  expectedJoinDate: "",
};

export default function AdminAdmissions() {
  const [filters, setFilters] = useState({
    status: "",
    classLevel: "",
    academicYear: "",
    search: "",
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdmissionRecord | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ admission: AdmissionRecord | null; status: AdmissionStatus | null }>({
    admission: null,
    status: null,
  });
  const [expectedJoinDate, setExpectedJoinDate] = useState("");

  const { toast } = useToast();
  const { data: admissionsData = [], isLoading, refetch, isRefetching } = useAdmissions(
    {
      status: filters.status ? (filters.status as AdmissionStatus) : undefined,
      classLevel: filters.classLevel || undefined,
      academicYear: filters.academicYear || undefined,
      search: filters.search || undefined,
    },
    { refetchInterval: 6000 },
  );
  const admissions = (admissionsData as AdmissionRecord[]) ?? [];

  const createAdmission = useCreateAdmissionRecord();
  const updateStatus = useUpdateAdmissionStatus();
  const deleteAdmission = useDeleteAdmission();
  const updateAdmission = useUpdateAdmissionRecord();

  const manualForm = useForm<ManualAdmissionForm>({
    resolver: zodResolver(manualAdmissionSchema),
    defaultValues: defaultManualValues,
  });

  const classOptions = useMemo(() => {
    const uploaded = new Set<string>();
    admissions.forEach((record) => {
      if (record.classApplyingFor) uploaded.add(record.classApplyingFor);
    });
    CLASS_OPTIONS.forEach((option) => uploaded.add(option.label));
    return Array.from(uploaded);
  }, [admissions]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    admissions.forEach((record) => {
      if (record.academicYear) years.add(record.academicYear);
    });
    return Array.from(years);
  }, [admissions]);

  const openDetail = (record: AdmissionRecord) => {
    setDetailRecord(record);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailRecord(null);
    setIsDetailOpen(false);
  };

  const handleManualSubmit = async (values: ManualAdmissionForm) => {
    if (values.status === "willing_to_join" && !values.expectedJoinDate) {
      manualForm.setError("expectedJoinDate", { message: "Expected joining date required for this status" });
      return;
    }
    try {
      await createAdmission.mutateAsync(values);
      toast({ title: "Admission saved" });
      manualForm.reset(defaultManualValues);
      setIsCreateOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create admission";
      toast({ variant: "destructive", title: message });
    }
  };

  const triggerStatusChange = (record: AdmissionRecord, status: AdmissionStatus) => {
    if (status === "willing_to_join") {
      setStatusDialog({ admission: record, status });
      setExpectedJoinDate(record.expectedJoinDate ?? "");
      return;
    }
    mutateStatus(record.id, status);
  };

  const mutateStatus = async (id: number, status: AdmissionStatus, joinDate?: string) => {
    try {
      await updateStatus.mutateAsync({
        id,
        status,
        expectedJoinDate: joinDate ?? undefined,
      });
      toast({ title: "Status updated" });
      setStatusDialog({ admission: null, status: null });
      setExpectedJoinDate("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update status";
      toast({ variant: "destructive", title: message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this enquiry permanently?")) return;
    try {
      await deleteAdmission.mutateAsync(id);
      toast({ title: "Admission removed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to delete admission";
      toast({ variant: "destructive", title: message });
    }
  };

  const handleDetailSave = async () => {
    if (!detailRecord) return;
    try {
      await updateAdmission.mutateAsync({
        id: detailRecord.id,
        data: {
          message: detailRecord.message,
          notes: detailRecord.notes,
        },
      });
      toast({ title: "Enquiry updated" });
      closeDetail();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update enquiry";
      toast({ variant: "destructive", title: message });
    }
  };

  const filteredAdmissions = admissions;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admissions Portal</h1>
            <p className="text-muted-foreground">
              Track every enquiry end-to-end, update counselling status, and log manual walk-ins.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Admission
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Search</Label>
              <Input
                value={filters.search}
                placeholder="Search by student, parent, phone, email"
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ADMISSION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ADMISSION_STATUS_META[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Class</Label>
              <Select
                value={filters.classLevel || "all"}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, classLevel: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Academic Year</Label>
              <Select
                value={filters.academicYear || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, academicYear: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Enquiries</CardTitle>
            <p className="text-sm text-muted-foreground">
              Auto-refreshes every 6 seconds • {filteredAdmissions.length} records
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAdmissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No enquiries found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmissions.map((admission) => (
                      <TableRow key={admission.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">{admission.studentName}</div>
                          <div className="text-xs text-muted-foreground">{admission.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{admission.classApplyingFor}</div>
                          <p className="text-xs text-muted-foreground">{admission.academicYear || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{admission.parentName}</div>
                          <p className="text-xs text-muted-foreground">{admission.previousSchool || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{admission.phone}</div>
                          <p className="text-xs text-muted-foreground">{admission.source === "public" ? "Online" : "Admin"}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {admission.submittedAt
                              ? new Date(admission.submittedAt).toLocaleDateString()
                              : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {admission.statusUpdatedAt ? `Updated ${new Date(admission.statusUpdatedAt).toLocaleDateString()}` : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-semibold", ADMISSION_STATUS_META[admission.status].badgeClass)}>
                            {ADMISSION_STATUS_META[admission.status].label}
                          </Badge>
                          {admission.expectedJoinDate && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Joining {new Date(admission.expectedJoinDate).toLocaleDateString()}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => openDetail(admission)} className="gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                {STATUS_ACTIONS.map((action) => (
                                  <DropdownMenuItem
                                    key={action.value}
                                    className="flex flex-col items-start"
                                    onClick={() => triggerStatusChange(admission, action.value)}
                                  >
                                    <span className="font-medium">{action.label}</span>
                                    <span className="text-xs text-muted-foreground">{action.description}</span>
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(admission.id)}
                                >
                                  <Trash className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create admission dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Admission / Walk-in Enquiry</DialogTitle>
          </DialogHeader>
          <form onSubmit={manualForm.handleSubmit(handleManualSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminField label="Student Name" error={manualForm.formState.errors.studentName?.message}>
              <Input {...manualForm.register("studentName")} placeholder="Student full name" />
            </AdminField>
            <AdminField label="Parent / Guardian" error={manualForm.formState.errors.parentName?.message}>
              <Input {...manualForm.register("parentName")} placeholder="Parent or guardian" />
            </AdminField>
            <AdminField label="Class" error={manualForm.formState.errors.classApplyingFor?.message}>
              <Select
                value={manualForm.watch("classApplyingFor")}
                onValueChange={(value) => manualForm.setValue("classApplyingFor", value, { shouldValidate: true })}
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
            </AdminField>
            <AdminField label="Academic Year" error={manualForm.formState.errors.academicYear?.message}>
              <Input {...manualForm.register("academicYear")} placeholder="2025-26" />
            </AdminField>
            <AdminField label="Date of Birth" error={manualForm.formState.errors.dob?.message}>
              <Input type="date" {...manualForm.register("dob")} />
            </AdminField>
            <AdminField label="Phone" error={manualForm.formState.errors.phone?.message}>
              <Input type="tel" {...manualForm.register("phone")} placeholder="+91 9XXXX XXXXX" />
            </AdminField>
            <AdminField label="Email" error={manualForm.formState.errors.email?.message}>
              <Input type="email" {...manualForm.register("email")} placeholder="parent@email.com" />
            </AdminField>
            <AdminField label="Previous School" error={manualForm.formState.errors.previousSchool?.message}>
              <Input {...manualForm.register("previousSchool")} placeholder="Previous school" />
            </AdminField>
            <AdminField label="Address" error={manualForm.formState.errors.address?.message} className="md:col-span-2">
              <Textarea rows={3} {...manualForm.register("address")} placeholder="House number, street, city" />
            </AdminField>
            <AdminField label="Notes / Message" error={manualForm.formState.errors.message?.message} className="md:col-span-2">
              <Textarea rows={3} {...manualForm.register("message")} placeholder="Clinic summary, test scores, etc." />
            </AdminField>
            <AdminField label="Status" error={manualForm.formState.errors.status?.message}>
              <Select
                value={manualForm.watch("status")}
                onValueChange={(value) => manualForm.setValue("status", value as AdmissionStatus, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ADMISSION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ADMISSION_STATUS_META[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminField>
            <AdminField
              label="Expected Joining Date"
              error={manualForm.formState.errors.expectedJoinDate?.message}
              hint="Required if status is Willing to Join"
            >
              <Input type="date" {...manualForm.register("expectedJoinDate")} />
            </AdminField>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  manualForm.reset(defaultManualValues);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="min-w-[140px]" disabled={createAdmission.isPending}>
                {createAdmission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Enquiry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={isDetailOpen} onOpenChange={(open) => (!open ? closeDetail() : setIsDetailOpen(true))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Admission Details</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailLine label="Student" value={detailRecord.studentName} />
                <DetailLine label="Class" value={detailRecord.classApplyingFor} />
                <DetailLine label="Parent" value={detailRecord.parentName} />
                <DetailLine label="Academic Year" value={detailRecord.academicYear || "—"} />
                <DetailLine label="Phone" value={detailRecord.phone} />
                <DetailLine label="Email" value={detailRecord.email} />
                <DetailLine label="Submitted" value={detailRecord.submittedAt ? new Date(detailRecord.submittedAt).toLocaleString() : "—"} />
                <DetailLine label="Source" value={detailRecord.source === "public" ? "Online Form" : "Admin"} />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Address</Label>
                <p className="text-sm">{detailRecord.address}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Message</Label>
                <Textarea
                  rows={3}
                  value={detailRecord.message ?? ""}
                  onChange={(e) => setDetailRecord((prev) => (prev ? { ...prev, message: e.target.value } : prev))}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Internal Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Counsellor notes, commitments, or follow-up reminders"
                  value={detailRecord.notes ?? ""}
                  onChange={(e) => setDetailRecord((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={closeDetail}>
                  Close
                </Button>
                <Button onClick={handleDetailSave} disabled={updateAdmission.isPending}>
                  {updateAdmission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status dialog for willing_to_join */}
      <Dialog
        open={Boolean(statusDialog.admission && statusDialog.status === "willing_to_join")}
        onOpenChange={(open) => {
          if (!open) {
            setStatusDialog({ admission: null, status: null });
            setExpectedJoinDate("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Expected Joining Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please capture the tentative joining date before confirming this enquiry as “Willing to Join”.
            </p>
            <div>
              <Label>Expected Joining Date</Label>
              <Input type="date" value={expectedJoinDate} onChange={(e) => setExpectedJoinDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusDialog({ admission: null, status: null });
                  setExpectedJoinDate("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!expectedJoinDate}
                onClick={() => {
                  if (statusDialog.admission && statusDialog.status && expectedJoinDate) {
                    mutateStatus(statusDialog.admission.id, statusDialog.status, expectedJoinDate);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function AdminField({
  label,
  children,
  error,
  className,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs font-semibold uppercase text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</Label>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}
