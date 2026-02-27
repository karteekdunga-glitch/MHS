import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import {
  useStudentLife,
  useCreateStudentLifeEntry,
  useUpdateStudentLifeEntry,
  useDeleteStudentLifeEntry,
  type StudentLifeEntry,
} from "@/hooks/use-additional-content";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Images, Trash2, Pencil, UploadCloud, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ExistingImageState = {
  id: number;
  imageUrl: string;
  keep: boolean;
};

type UploadPreview = {
  file: File;
  preview: string;
};

const DEFAULT_FORM = {
  title: "",
  description: "",
  highlightTag: "",
  status: "draft",
};

export default function AdminStudentLife() {
  const { data: studentLifeData = [], isLoading } = useStudentLife();
  const entries = (studentLifeData as StudentLifeEntry[]) ?? [];
  const createMutation = useCreateStudentLifeEntry();
  const updateMutation = useUpdateStudentLifeEntry();
  const deleteMutation = useDeleteStudentLifeEntry();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState(DEFAULT_FORM);
  const [existingImages, setExistingImages] = useState<ExistingImageState[]>([]);
  const [newImages, setNewImages] = useState<UploadPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const publishedCount = useMemo(() => entries.filter((entry) => entry.status === "published").length, [entries]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    setExistingImages([]);
    clearNewImages();
    setFormError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: StudentLifeEntry) => {
    setEditingId(entry.id);
    setFormState({
      title: entry.title,
      description: entry.description,
      highlightTag: entry.highlightTag ?? "",
      status: entry.status,
    });
    setExistingImages(entry.images?.map((img) => ({ id: img.id, imageUrl: img.imageUrl, keep: true })) ?? []);
    clearNewImages();
    setFormError(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    return () => {
      newImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
    };
  }, [newImages]);

  const clearNewImages = () => {
    newImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setNewImages([]);
  };

  const handleFileSelection = (files: FileList | File[]) => {
    const additions = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...additions]);
  };

  const removeNewImage = (preview: string) => {
    const target = newImages.find((item) => item.preview === preview);
    if (target) {
      URL.revokeObjectURL(target.preview);
    }
    setNewImages((prev) => prev.filter((item) => item.preview !== preview));
  };

  const toggleExistingImage = (id: number) => {
    setExistingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, keep: !img.keep } : img)),
    );
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    setExistingImages([]);
    clearNewImages();
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = formState.title.trim();
    const trimmedDescription = formState.description.trim();
    if (!trimmedTitle || !trimmedDescription) {
      setFormError("Title and description are required.");
      return;
    }
    const retainedIds = editingId
      ? existingImages.filter((img) => img.keep).map((img) => img.id)
      : [];
    const hasAnyImage = retainedIds.length > 0 || newImages.length > 0;
    if (!hasAnyImage) {
      setFormError("Upload at least one image for this story.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: trimmedTitle,
      description: trimmedDescription,
      status: formState.status,
    };
    if (formState.highlightTag.trim()) {
      payload.highlightTag = formState.highlightTag.trim();
    }
    if (editingId) {
      payload.retainImageIds = retainedIds;
    }

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    newImages.forEach(({ file }) => {
      formData.append("images", file);
    });

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast({ title: "Student life story updated." });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Student life story added." });
      }
      closeDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save entry.";
      setFormError(message);
    }
  };

  const handleDelete = async (entry: StudentLifeEntry) => {
    if (!confirm(`Delete "${entry.title}" permanently? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(entry.id);
      toast({ title: "Student life entry deleted." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Failed to delete entry.",
      });
    }
  };

  const handleStatusToggle = async (entry: StudentLifeEntry) => {
    const nextStatus = entry.status === "published" ? "draft" : "published";
    const formData = new FormData();
    formData.append("payload", JSON.stringify({ status: nextStatus }));
    try {
      await updateMutation.mutateAsync({ id: entry.id, data: formData });
      toast({
        title: `Marked as ${nextStatus === "published" ? "Published" : "Draft"}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Failed to update status.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Images className="h-6 w-6 text-primary" />
              Student Life Stories
            </h1>
            <p className="text-muted-foreground">
              Showcase vibrant campus moments with rich galleries and descriptions.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Story
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-6 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-2xl font-semibold">{entries.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-semibold text-emerald-600">{publishedCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-semibold text-amber-600">{entries.length - publishedCount}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <Card className="col-span-full text-center py-16">
              <CardContent>
                <p className="text-muted-foreground">No student life entries yet. Add your first story!</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="flex flex-col">
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-slate-100">
                  {entry.images?.length ? (
                    <img
                      src={entry.images[0].imageUrl}
                      alt={entry.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                  {entry.highlightTag && (
                    <Badge className="absolute top-3 left-3 bg-primary text-white flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {entry.highlightTag}
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      "absolute top-3 right-3",
                      entry.status === "published" ? "bg-emerald-600" : "bg-slate-600",
                    )}
                  >
                    {entry.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{entry.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-3">{entry.description}</p>
                </CardHeader>
                <CardContent className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditDialog(entry)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={entry.status === "published" ? "secondary" : "default"}
                    className="gap-1"
                    onClick={() => handleStatusToggle(entry)}
                  >
                    <Eye className="h-4 w-4" />
                    {entry.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive gap-1"
                    onClick={() => handleDelete(entry)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(true))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student Life Story" : "Add Student Life Story"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Inter-house Cultural Fest"
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
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="highlight">Highlight Tag (Optional)</Label>
              <Input
                id="highlight"
                value={formState.highlightTag}
                onChange={(e) => setFormState((prev) => ({ ...prev, highlightTag: e.target.value }))}
                placeholder="Cultural Week"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                rows={6}
                placeholder="Describe the event, student reflections, learning outcomes, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Gallery Images</Label>
              <div
                className={cn(
                  "border border-dashed rounded-xl p-6 text-center transition",
                  isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  e.dataTransfer.files && handleFileSelection(e.dataTransfer.files);
                }}
              >
                <UploadCloud className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop up to 10 images, or click to select files.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                />
              </div>
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {existingImages.map((image) => (
                    <div
                      key={image.id}
                      className={cn(
                        "relative rounded-lg overflow-hidden border",
                        image.keep ? "opacity-100" : "opacity-40",
                      )}
                    >
                      <img src={image.imageUrl} alt="Existing media" className="h-32 w-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => toggleExistingImage(image.id)}
                      >
                        {image.keep ? "Remove" : "Keep"}
                      </Button>
                    </div>
                  ))}
                  {newImages.map((item) => (
                    <div key={item.preview} className="relative rounded-lg overflow-hidden border">
                      <img src={item.preview} alt="New upload" className="h-32 w-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeNewImage(item.preview)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="min-w-[140px]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  "Save Changes"
                ) : (
                  "Create Story"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
