import { useCallback, useEffect, useMemo, useState } from "react";
import type { Ranker } from "@shared/schema";
import { AdminLayout } from "@/components/AdminLayout";
import {
  useRankers,
  useCreateRanker,
  useUpdateRanker,
  useDeleteRanker,
  useUploadRankerPhoto,
} from "@/hooks/use-rankers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2, Trophy, Info, AlertTriangle, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Cropper, { type Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { cropImageToFile } from "@/lib/crop-image";

type RankerFormState = {
  studentName: string;
  hallTicket: string;
  className: string;
  examName: string;
  rank: string;
  year: string;
  score: string;
  percentage: string;
  imageUrl: string;
  status: string;
};

const emptyForm: RankerFormState = {
  studentName: "",
  hallTicket: "",
  className: "",
  examName: "",
  rank: "",
  year: new Date().getFullYear().toString(),
  score: "",
  percentage: "",
  imageUrl: "",
  status: "draft",
};

const WARNING_RULES: Array<{ key: keyof RankerFormState | "imageUrl"; label: string; predicate: (ranker: Ranker) => boolean }> =
  [
    { key: "hallTicket", label: "Hall ticket missing", predicate: (r) => !r.hallTicket },
    { key: "className", label: "Class not set", predicate: (r) => !r.className },
    { key: "imageUrl", label: "Student photo missing", predicate: (r) => !r.imageUrl },
  ];

function getWarnings(ranker: Ranker) {
  return WARNING_RULES.filter((rule) => rule.predicate(ranker)).map((rule) => rule.label);
}

export default function AdminRankers() {
  const { data: rankers = [], isLoading } = useRankers();
  const createMutation = useCreateRanker();
  const updateMutation = useUpdateRanker();
  const deleteMutation = useDeleteRanker();
  const uploadPhotoMutation = useUploadRankerPhoto();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSource, setEditingSource] = useState<Ranker["source"] | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [formData, setFormData] = useState<RankerFormState>(emptyForm);

  const rowsWithWarnings = useMemo(() => rankers.filter((item) => getWarnings(item).length > 0), [rankers]);
  const editingRanker = editingId ? rankers.find((item) => item.id === editingId) ?? null : null;

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const openCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setSelectedPhoto(null);
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
    setEditingSource(null);
    setIsOpen(true);
  };

  const openEdit = (record: Ranker) => {
    setFormData({
      studentName: record.studentName,
      hallTicket: record.hallTicket || "",
      className: record.className || "",
      examName: record.examName || "",
      rank: record.rank.toString(),
      year: record.year.toString(),
      score: record.score.toString(),
      percentage: record.percentage ? record.percentage.toString() : "",
      imageUrl: record.imageUrl || "",
      status: record.status,
    });
    setEditingId(record.id);
    setSelectedPhoto(null);
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(record.imageUrl || null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
    setEditingSource(record.source);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
    setSelectedPhoto(null);
    setEditingId(null);
    setEditingSource(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
  };

  const handlePhotoChange = (fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    if (!file) return;
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setSelectedPhoto(file);
    setPhotoPreview(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(true);
  };

  const handleApplyCrop = async () => {
    if (!photoPreview || !croppedAreaPixels) {
      return;
    }
    try {
      setIsApplyingCrop(true);
      const croppedFile = await cropImageToFile(
        photoPreview,
        croppedAreaPixels,
        selectedPhoto?.name ?? "ranker-photo.jpg",
        selectedPhoto?.type ?? "image/jpeg",
      );
      const nextPreview = URL.createObjectURL(croppedFile);
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
      setSelectedPhoto(croppedFile);
      setPhotoPreview(nextPreview);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsCropping(false);
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...formData,
      hallTicket: formData.hallTicket.trim() || undefined,
      className: formData.className.trim() || undefined,
      examName: formData.examName.trim() || undefined,
      rank: Number(formData.rank),
      year: Number(formData.year),
      score: Number(formData.score),
      percentage: formData.percentage ? Number(formData.percentage) : undefined,
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
      if (selectedPhoto) {
        await uploadPhotoMutation.mutateAsync({ id: editingId, file: selectedPhoto });
      }
    } else {
      const created = await createMutation.mutateAsync(payload);
      if (selectedPhoto) {
        await uploadPhotoMutation.mutateAsync({ id: created.id, file: selectedPhoto });
      }
    }

    closeDialog();
  };

  const busy = createMutation.isPending || updateMutation.isPending || uploadPhotoMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-accent" /> Rankers
          </h2>
          <p className="text-muted-foreground">
            Auto-synced from Exam Results. Use quick edits below to polish names, hall tickets, or portraits.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : closeDialog())}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" /> Add Ranker
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Ranker" : "Add Ranker"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Student Name</Label>
                  <Input
                    required
                    value={formData.studentName}
                    onChange={(event) => setFormData((prev) => ({ ...prev, studentName: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hall Ticket</Label>
                  <Input value={formData.hallTicket} onChange={(event) => setFormData((prev) => ({ ...prev, hallTicket: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Class / Grade</Label>
                  <Input value={formData.className} onChange={(event) => setFormData((prev) => ({ ...prev, className: event.target.value }))} placeholder="Class 10" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Exam Name</Label>
                  <Input value={formData.examName} onChange={(event) => setFormData((prev) => ({ ...prev, examName: event.target.value }))} placeholder="English Medium Board Finals" />
                </div>
                <div className="space-y-2">
                  <Label>Rank</Label>
                  <Input type="number" required value={formData.rank} onChange={(event) => setFormData((prev) => ({ ...prev, rank: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" required value={formData.score} onChange={(event) => setFormData((prev) => ({ ...prev, score: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input type="number" required value={formData.year} onChange={(event) => setFormData((prev) => ({ ...prev, year: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Percentage</Label>
                  <Input type="number" step="0.01" value={formData.percentage} onChange={(event) => setFormData((prev) => ({ ...prev, percentage: event.target.value }))} placeholder="92.65" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Hidden)</SelectItem>
                      <SelectItem value="published">Published (Visible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={formData.imageUrl} onChange={(event) => setFormData((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://images.unsplash.com/..." />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Upload Photo</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoChange(event.target.files)}
                      />
                      {selectedPhoto && (
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <ImagePlus className="h-3 w-3" />
                          {selectedPhoto.name}
                        </Badge>
                      )}
                    </div>
                    {photoPreview ? (
                      isCropping ? (
                        <div className="space-y-3">
                          <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-200">
                            <Cropper
                              image={photoPreview}
                              crop={crop}
                              zoom={zoom}
                              aspect={3 / 4}
                              onCropChange={setCrop}
                              onZoomChange={setZoom}
                              onCropComplete={onCropComplete}
                              showGrid={false}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Zoom</span>
                            <Slider
                              value={[zoom]}
                              onValueChange={(value) => setZoom(value[0] ?? 1)}
                              min={1}
                              max={3}
                              step={0.1}
                              className="flex-1"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button type="button" onClick={handleApplyCrop} disabled={isApplyingCrop || !croppedAreaPixels}>
                              {isApplyingCrop ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Crop"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsCropping(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <img
                            src={photoPreview}
                            alt={formData.studentName || "Ranker preview"}
                            className="h-44 w-36 rounded-2xl border object-cover shadow-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setCrop({ x: 0, y: 0 });
                              setZoom(1);
                              setCroppedAreaPixels(null);
                              setIsCropping(true);
                            }}
                          >
                            {selectedPhoto ? "Adjust Crop" : "Recrop Current Photo"}
                          </Button>
                          {selectedPhoto && (
                            <Badge variant="secondary" className="w-fit">
                              Cropped file ready to save
                            </Badge>
                          )}
                        </div>
                      )
                    ) : editingRanker?.imageUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={editingRanker.imageUrl}
                          alt={editingRanker.studentName}
                          className="h-44 w-36 rounded-2xl border object-cover shadow-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Current photo will be retained if no new image is uploaded.
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {editingSource === "auto" && (
                    <p className="text-xs text-muted-foreground">
                      Uploading a custom image keeps this record dynamic while preserving your chosen portrait.
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5" />
        <p>
          Top ten rankers update automatically whenever results are uploaded. Overrides (names, classes, hall tickets, photos) stay pinned until you remove them.
        </p>
      </div>

      {rowsWithWarnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <p>
            {rowsWithWarnings.length} ranker{rowsWithWarnings.length > 1 ? "s" : ""} need details. Fix missing hall tickets,
            class labels, or portraits to unlock the public hero carousel.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Hall Ticket</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Marks</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : rankers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  No rankers yet. Upload exam results to auto-generate this list.
                </TableCell>
              </TableRow>
            ) : (
              rankers.map((item) => {
                const warnings = getWarnings(item);
                return (
                  <TableRow key={item.id} className={warnings.length ? "bg-amber-50/60" : undefined}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-border/60">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.studentName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Photo</div>
                        )}
                      </div>
                      <div>
                        <div>{item.studentName}</div>
                        <p className="text-xs text-muted-foreground">#{item.rank}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.hallTicket || "—"}</TableCell>
                    <TableCell className="font-semibold text-primary">#{item.rank}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>{item.className || "—"}</TableCell>
                    <TableCell>{item.year}</TableCell>
                    <TableCell>
                      <Badge variant={item.source === "auto" ? "secondary" : "outline"} className={item.source === "auto" ? "bg-emerald-100 text-emerald-800" : ""}>
                        {item.source === "auto" ? "Auto" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {warnings.length ? (
                        <Button variant="ghost" size="sm" className="text-destructive flex items-center gap-2" onClick={() => openEdit(item)}>
                          <AlertTriangle className="h-4 w-4" /> Fix ({warnings.length})
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit ranker">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={item.source === "auto"}
                        title={item.source === "auto" ? "Auto-synced rankers remove themselves when results change" : "Delete ranker"}
                        onClick={() => {
                          if (item.source !== "auto" && confirm("Delete this ranker?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className={item.source === "auto" ? "opacity-40 cursor-not-allowed" : "text-destructive"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
