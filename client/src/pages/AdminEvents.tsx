import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { AdminLayout } from "@/components/AdminLayout";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Clock,
  Filter,
  ImageIcon,
  MapPin,
  PenSquare,
  Plus,
  RefreshCcw,
  Tag,
  Trash2,
  UploadCloud,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type EventImage = {
  id: number;
  imageUrl: string;
  sourceType?: string;
  filePath?: string | null;
};

type AdminEvent = {
  id: number;
  title: string;
  description?: string | null;
  location: string;
  category: string;
  status: string;
  startDateTime: string;
  endDateTime?: string | null;
  publishAt?: string | null;
  images: EventImage[];
};

type UploadPreview = {
  file: File;
  preview: string;
};

type ExistingImageState = {
  id: number;
  url: string;
  keep: boolean;
};

type RemoteImageField = {
  url: string;
  caption: string;
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  location: "",
  category: "General",
  status: "draft",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
};

const EVENT_STATUS_META: Record<
  string,
  { label: string; badgeClass: string; pillClass: string; nextLabel: string }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-200 text-slate-800",
    pillClass: "bg-slate-50 border border-slate-200 text-slate-700",
    nextLabel: "Publish",
  },
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-blue-100 text-blue-900",
    pillClass: "bg-blue-50 border border-blue-100 text-blue-800",
    nextLabel: "Mark Published",
  },
  published: {
    label: "Published",
    badgeClass: "bg-emerald-100 text-emerald-900",
    pillClass: "bg-emerald-50 border border-emerald-100 text-emerald-800",
    nextLabel: "Move to Draft",
  },
  expired: {
    label: "Expired",
    badgeClass: "bg-rose-100 text-rose-900",
    pillClass: "bg-rose-50 border border-rose-100 text-rose-800",
    nextLabel: "Republish",
  },
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Published", value: "published" },
  { label: "Expired", value: "expired" },
];

export default function AdminEvents() {
  const { data: events = [], isLoading } = useEvents();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const { toast } = useToast();

  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [uploadedImages, setUploadedImages] = useState<UploadPreview[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImageState[]>([]);
  const [remoteImages, setRemoteImages] = useState<RemoteImageField[]>([{ url: "", caption: "" }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return () => {
      uploadedImages.forEach((preview) => URL.revokeObjectURL(preview.preview));
    };
  }, [uploadedImages]);

  const openCreateDialog = () => {
    setEditingEvent(null);
    setFormState({
      ...DEFAULT_FORM,
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
    });
    clearUploads();
    setRemoteImages([{ url: "", caption: "" }]);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (event: AdminEvent) => {
    setEditingEvent(event);
    const start = toDate(event.startDateTime);
    const end = event.endDateTime ? toDate(event.endDateTime) : null;
    setFormState({
      title: event.title,
      description: event.description ?? "",
      location: event.location,
      category: event.category,
      status: event.status,
      startDate: start ? format(start, "yyyy-MM-dd") : "",
      startTime: start ? format(start, "HH:mm") : "",
      endDate: end ? format(end, "yyyy-MM-dd") : "",
      endTime: end ? format(end, "HH:mm") : "",
    });
    setExistingImages(
      (event.images ?? []).map((img) => ({ id: img.id, url: img.imageUrl, keep: true })),
    );
    clearUploads();
    setRemoteImages([{ url: "", caption: "" }]);
    setFormError(null);
    setDialogOpen(true);
  };

  const clearUploads = () => {
    uploadedImages.forEach((preview) => URL.revokeObjectURL(preview.preview));
    setUploadedImages([]);
  };

  const handleFileSelection = (files: FileList | File[]) => {
    const additions = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...additions]);
  };

  const removeUpload = (previewUrl: string) => {
    const target = uploadedImages.find((item) => item.preview === previewUrl);
    if (target) URL.revokeObjectURL(target.preview);
    setUploadedImages((prev) => prev.filter((item) => item.preview !== previewUrl));
  };

  const toggleExistingImage = (id: number) => {
    setExistingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, keep: !img.keep } : img)),
    );
  };

  const addRemoteImageField = () => {
    setRemoteImages((prev) => [...prev, { url: "", caption: "" }]);
  };

  const updateRemoteField = (index: number, key: keyof RemoteImageField, value: string) => {
    setRemoteImages((prev) =>
      prev.map((field, idx) => (idx === index ? { ...field, [key]: value } : field)),
    );
  };

  const filteredEvents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return (events as AdminEvent[]).filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        (event.location?.toLowerCase().includes(term) ?? false) ||
        (event.category?.toLowerCase().includes(term) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const base = { draft: 0, scheduled: 0, published: 0, expired: 0 };
    (events as AdminEvent[]).forEach((event) => {
      base[event.status as keyof typeof base] = (base[event.status as keyof typeof base] ?? 0) + 1;
    });
    return base;
  }, [events]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setFormError(null);
    clearUploads();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.location.trim()) {
      setFormError("Title and location are required.");
      return;
    }
    if (!formState.startDate || !formState.startTime) {
      setFormError("Start date and time are required.");
      return;
    }
    const payload: Record<string, unknown> = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      location: formState.location.trim(),
      category: formState.category.trim() || "General",
      status: formState.status,
      startDateTime: combineDateTime(formState.startDate, formState.startTime),
    };
    if (formState.endDate || formState.endTime) {
      payload.endDateTime = combineDateTime(
        formState.endDate || formState.startDate,
        formState.endTime || formState.startTime,
      );
    }
    if (editingEvent?.status === "scheduled" || formState.status === "scheduled") {
      payload.publishAt = payload.startDateTime;
    }
    const remotePayload = remoteImages
      .filter((field) => field.url.trim().length > 0)
      .map((field) => ({
        url: field.url.trim(),
        caption: field.caption.trim(),
      }));
    if (remotePayload.length) {
      payload.remoteImages = remotePayload;
    }
    if (editingEvent) {
      payload.retainImageIds = existingImages.filter((img) => img.keep).map((img) => img.id);
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    uploadedImages.forEach(({ file }) => formData.append("images", file));

    try {
      if (editingEvent) {
        await updateMutation.mutateAsync({ id: editingEvent.id, data: formData });
        toast({ title: "Event updated successfully." });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Event created!" });
      }
      handleCloseDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save the event.";
      setFormError(message);
    }
  };

  const handleStatusUpdate = async (event: AdminEvent, nextStatus: string) => {
    const payload = {
      status: nextStatus,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
    };
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    try {
      await updateMutation.mutateAsync({ id: event.id, data: formData });
      toast({ title: `Event marked as ${EVENT_STATUS_META[nextStatus]?.label ?? nextStatus}.` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Failed to update status.",
      });
    }
  };

  const handleDelete = async (event: AdminEvent) => {
    if (!confirm(`Delete "${event.title}" permanently?`)) return;
    try {
      await deleteMutation.mutateAsync(event.id);
      toast({ title: "Event deleted." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Failed to delete event.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              Events & Activities
            </h1>
            <p className="text-muted-foreground">
              Schedule, publish, and promote every school experience from one place.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => setStatusFilter("all")}>
              <RefreshCcw className="h-4 w-4" />
              Reset Filters
            </Button>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(EVENT_STATUS_META).map(([status, meta]) => (
            <Card
              key={status}
              className={cn(
                "shadow-sm border",
                statusFilter === status ? "border-primary ring-1 ring-primary/40" : "border-border",
              )}
            >
              <CardContent className="py-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {meta.label}
                  </div>
                  <Badge className={meta.badgeClass}>{statusCounts[status as keyof typeof statusCounts] ?? 0}</Badge>
                </div>
                <p className="text-2xl font-bold">
                  {statusCounts[status as keyof typeof statusCounts] ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="bg-white border rounded-2xl shadow-sm p-4 md:p-6 space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search by title, venue, or category..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-3 pr-4">Event</th>
                  <th className="py-3 pr-4">Schedule</th>
                  <th className="py-3 pr-4 hidden lg:table-cell">Location</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading events...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      No events match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b last:border-none">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center ring-1 ring-border/60">
                            {event.images?.length ? (
                              <img
                                src={event.images[0].imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-base">{event.title}</div>
                            <p className="text-muted-foreground line-clamp-2 text-xs md:text-sm">
                              {event.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Tag className="h-3 w-3" />
                              {event.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="text-sm font-medium">
                          {formatDateRange(event.startDateTime, event.endDateTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeRange(event.startDateTime, event.endDateTime)}
                        </div>
                      </td>
                      <td className="py-4 pr-4 hidden lg:table-cell text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge className={EVENT_STATUS_META[event.status]?.badgeClass}>
                          {EVENT_STATUS_META[event.status]?.label ?? event.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openEditDialog(event)}
                          >
                            <PenSquare className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() =>
                              handleStatusUpdate(
                                event,
                                computeNextStatus(event.status),
                              )
                            }
                          >
                            <Clock className="h-4 w-4" />
                            {EVENT_STATUS_META[computeNextStatus(event.status)]?.nextLabel ?? "Update Status"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="gap-1"
                          >
                            <a href={`/events?highlight=${event.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-4 w-4" />
                              View
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? handleCloseDialog() : setDialogOpen(true))}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Update Event" : "Create Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Science Fair 2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formState.category}
                  onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Academics, Sports..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formState.location}
                  onChange={(e) => setFormState((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Auditorium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Share agenda, featured guests, highlights..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formState.startDate}
                  onChange={(e) => setFormState((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formState.startTime}
                  onChange={(e) => setFormState((prev) => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formState.endDate}
                  onChange={(e) => setFormState((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formState.endTime}
                  onChange={(e) => setFormState((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Gallery</Label>
              <div className="border border-dashed rounded-xl p-6 text-center">
                <UploadCloud className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-3">
                  Drag and drop up to 8 images, or click to browse.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                />
              </div>
              {(existingImages.length > 0 || uploadedImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden border">
                      <img src={img.url} alt="Existing" className="h-32 w-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => toggleExistingImage(img.id)}
                      >
                        {img.keep ? "Remove" : "Keep"}
                      </Button>
                    </div>
                  ))}
                  {uploadedImages.map((item) => (
                    <div key={item.preview} className="relative rounded-xl overflow-hidden border">
                      <img src={item.preview} alt="Upload" className="h-32 w-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeUpload(item.preview)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Remote Image URLs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRemoteImageField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add URL
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {remoteImages.map((field, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="https://..."
                      value={field.url}
                      onChange={(e) => updateRemoteField(index, "url", e.target.value)}
                    />
                    <Input
                      placeholder="Caption (optional)"
                      value={field.caption}
                      onChange={(e) => updateRemoteField(index, "caption", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-w-[150px]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function formatDateRange(start?: string, end?: string | null) {
  if (!start) return "--";
  const startDate = toDate(start);
  const endDate = end ? toDate(end) : null;
  if (!startDate) return "--";
  if (!endDate || format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd")) {
    return format(startDate, "MMMM d, yyyy");
  }
  return `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`;
}

function formatTimeRange(start?: string, end?: string | null) {
  if (!start) return "";
  const startDate = toDate(start);
  const endDate = end ? toDate(end) : null;
  if (!startDate) return "";
  if (!endDate) return format(startDate, "hh:mm a");
  return `${format(startDate, "hh:mm a")} – ${format(endDate, "hh:mm a")}`;
}

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}`).toISOString();
}

function toDate(value?: string | null) {
  if (!value) return null;
  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function computeNextStatus(current: string) {
  switch (current) {
    case "draft":
      return "published";
    case "scheduled":
      return "published";
    case "published":
      return "draft";
    default:
      return "draft";
  }
}
