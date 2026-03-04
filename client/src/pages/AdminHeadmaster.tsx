import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Quote, Pencil, Trash2, Plus, Loader2, UploadCloud } from "lucide-react";
import { useHeadmasterMessages, useCreateHeadmasterMessage, useUpdateHeadmasterMessage, useDeleteHeadmasterMessage } from "@/hooks/use-headmaster";
import type { HeadmasterMessage } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Cropper, { type Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { cropImageToFile } from "@/lib/crop-image";

const FALLBACK_PORTRAIT = "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80";

const revokeObjectUrl = (value: string | null) => {
  if (value && value.startsWith("blob:")) {
    URL.revokeObjectURL(value);
  }
};

type FormState = {
  headName: string;
  role: string;
  title: string;
  highlightQuote: string;
  message: string;
  status: "draft" | "published";
  imageSourceType: "upload" | "url";
  imageUrl: string;
};

const DEFAULT_FORM: FormState = {
  headName: "",
  role: "Correspondent & Head Master",
  title: "",
  highlightQuote: "",
  message: "",
  status: "draft",
  imageSourceType: "upload",
  imageUrl: "",
};

export default function AdminHeadmaster() {
  const { data: headmasterMessages = [], isLoading } = useHeadmasterMessages();
  const messages = useMemo(() => (headmasterMessages as HeadmasterMessage[]) ?? [], [headmasterMessages]);
  const createMutation = useCreateHeadmasterMessage();
  const updateMutation = useUpdateHeadmasterMessage();
  const deleteMutation = useDeleteHeadmasterMessage();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const onCropComplete = useCallback((_cropped: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (formState.imageSourceType !== "upload") {
      setSelectedImage(null);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    }
  }, [formState.imageSourceType, preview]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    setSelectedImage(null);
    revokeObjectUrl(preview);
    setPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (message: HeadmasterMessage) => {
    setEditingId(message.id);
    setFormState({
      headName: message.headName,
      role: message.role,
      title: message.title,
      highlightQuote: message.highlightQuote ?? "",
      message: message.message,
      status: (message.status as "draft" | "published") ?? "draft",
      imageSourceType: (message.imageSourceType as "upload" | "url") ?? "upload",
      imageUrl: message.imageUrl ?? "",
    });
    setSelectedImage(null);
    revokeObjectUrl(preview);
    setPreview(message.imageUrl ?? null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    revokeObjectUrl(preview);
    setPreview(null);
    setSelectedImage(null);
    setFormError(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) {
      revokeObjectUrl(preview);
    }
    const objectUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setPreview(objectUrl);
    setIsCropping(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setFormError(null);
    event.target.value = "";
  };

  const handleApplyCrop = async () => {
    if (!preview || !croppedAreaPixels) {
      setFormError("Adjust the crop before applying.");
      return;
    }
    try {
      setIsApplyingCrop(true);
      const croppedFile = await cropImageToFile(
        preview,
        croppedAreaPixels,
        selectedImage?.name ?? "headmaster-portrait.jpg",
        selectedImage?.type ?? "image/jpeg",
      );
      const newPreview = URL.createObjectURL(croppedFile);
      revokeObjectUrl(preview);
      setSelectedImage(croppedFile);
      setPreview(newPreview);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to apply crop.");
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.headName.trim() || !formState.title.trim() || !formState.message.trim()) {
      setFormError("Head name, title, and message are required.");
      return;
    }

    if (formState.imageSourceType === "upload" && !editingId && !selectedImage) {
      setFormError("Upload a portrait for the Head Master.");
      return;
    }

    if (formState.imageSourceType === "url" && !formState.imageUrl.trim()) {
      setFormError("Provide a valid image URL.");
      return;
    }

    const payload: Record<string, unknown> = {
      headName: formState.headName.trim(),
      role: formState.role.trim(),
      title: formState.title.trim(),
      highlightQuote: formState.highlightQuote.trim() || undefined,
      message: formState.message.trim(),
      status: formState.status,
      imageSourceType: formState.imageSourceType,
    };
    if (formState.imageSourceType === "url") {
      payload.imageUrl = formState.imageUrl.trim();
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    if (formState.imageSourceType === "upload" && selectedImage) {
      formData.append("image", selectedImage);
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast({ title: "Head Master message updated." });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Head Master message published." });
      }
      closeDialog();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save record.");
    }
  };

  const handleDelete = async (message: HeadmasterMessage) => {
    if (!confirm(`Delete "${message.title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(message.id);
      toast({ title: "Head Master message removed." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Failed to delete message.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-primary/70">Leadership Voice</p>
          <h1 className="text-3xl font-bold text-primary">Head Master's Words</h1>
          <p className="text-muted-foreground mt-1">
            Craft heartfelt notes from the correspondent or principal to motivate families and students.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          New Message
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading messages...</CardContent>
          </Card>
        ) : messages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No Head Master messages yet. Click “New Message” to add the first note.
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="overflow-hidden shadow-md border border-primary/10">
              <CardContent className="p-6 flex flex-col lg:flex-row gap-6">
                <div className="relative w-full max-w-[260px]">
                  <div className="rounded-3xl overflow-hidden shadow-2xl">
                    <img
                      src={message.imageUrl || FALLBACK_PORTRAIT}
                      alt={message.headName}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                  <Badge
                    className={cn(
                      "absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1",
                      message.status === "published" ? "bg-emerald-500/90" : "bg-slate-500/80",
                    )}
                  >
                    {message.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-primary">{message.title}</h2>
                    <Badge variant="outline" className="uppercase tracking-[0.3em] text-xs">
                      {message.role}
                    </Badge>
                  </div>
                  <p className="text-lg italic text-primary/80 flex items-start gap-2">
                    <Quote className="w-5 h-5 text-accent mt-1" /> {message.highlightQuote || "“Inspire curiosity, lead with kindness.”"}
                  </p>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {message.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Updated {format(new Date(message.updatedAt ?? message.createdAt ?? new Date()), "MMM dd, yyyy")}</span>
                    <span className="text-primary font-semibold">{message.headName}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="gap-2" onClick={() => openEditDialog(message)}>
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    <Button variant="destructive" className="gap-2" onClick={() => handleDelete(message)}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Head Master Message" : "New Head Master Message"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Head Master Name</Label>
                <Input value={formState.headName} onChange={(event) => setFormState((prev) => ({ ...prev, headName: event.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input value={formState.role} onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Message Title</Label>
              <Input value={formState.title} onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Highlight Quote</Label>
              <Input value={formState.highlightQuote} onChange={(event) => setFormState((prev) => ({ ...prev, highlightQuote: event.target.value }))} placeholder="Short inspiring sentence" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={formState.message} onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))} rows={6} required placeholder="Share the Head Master's reflections, goals, and encouragement." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as "draft" | "published" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image Source</Label>
                <Select value={formState.imageSourceType} onValueChange={(value) => setFormState((prev) => ({ ...prev, imageSourceType: value as "upload" | "url" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="url">Remote URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formState.imageSourceType === "url" ? (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={formState.imageUrl} onChange={(event) => setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="https://images..." />
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Portrait Upload</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
                {preview ? (
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">{isCropping ? "Adjust Crop" : "Preview"}</Label>
                    {isCropping ? (
                      <>
                        <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl bg-slate-200">
                          <Cropper
                            image={preview}
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
                      </>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <img src={preview} alt="Preview" className="h-56 w-44 rounded-2xl object-cover border shadow-lg" />
                        {selectedImage && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCropping(true);
                              setCrop({ x: 0, y: 0 });
                              setZoom(1);
                              setCroppedAreaPixels(null);
                            }}
                          >
                            Adjust Crop
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : editingId ? (
                  <p className="text-xs text-muted-foreground">Current portrait will be retained if no new file is uploaded.</p>
                ) : null}
              </div>
            )}
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {editingId ? "Save Changes" : "Publish Message"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
