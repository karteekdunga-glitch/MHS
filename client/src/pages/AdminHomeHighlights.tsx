import { useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useGlobalImages,
  useCreateGlobalImages,
  useUpdateGlobalImage,
  useDeleteGlobalImage,
  type GlobalImage,
} from "@/hooks/use-additional-content";

export default function AdminHomeHighlights() {
  const { data: images = [], isLoading } = useGlobalImages();
  const createImages = useCreateGlobalImages();
  const updateImage = useUpdateGlobalImage();
  const deleteImage = useDeleteGlobalImage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState("");

  const sortedImages = useMemo(() => {
    return [...(images as GlobalImage[])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );
  }, [images]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    formData.append("status", "published");
    try {
      await createImages.mutateAsync(formData);
      toast({ title: "Images uploaded", description: `${files.length} image(s) added.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload images";
      toast({ variant: "destructive", title: "Upload failed", description: message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      await createImages.mutateAsync({
        imageSourceType: "url",
        imageUrl: trimmed,
        status: "published",
      });
      toast({ title: "Image added", description: "Image URL saved successfully." });
      setUrl("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add image";
      toast({ variant: "destructive", title: "Add failed", description: message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this highlight image?")) return;
    try {
      await deleteImage.mutateAsync(id);
      toast({ title: "Image removed" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete image";
      toast({ variant: "destructive", title: "Delete failed", description: message });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Home Highlights</h2>
          <p className="text-muted-foreground">
            Manage the full-width slider images shown above the Student Life cards on the home page.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Highlight Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => handleUpload(event.target.files)}
              />
              <Button
                type="button"
                className="gap-2 w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={createImages.isPending}
              >
                {createImages.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload Images
              </Button>
              <div className="flex w-full flex-1 gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                />
                <Button type="button" variant="outline" className="gap-2" onClick={handleAddUrl}>
                  <Plus className="h-4 w-4" /> Add URL
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload JPEG/PNG images or add a remote image URL. Images are shown in the slider in order.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sortedImages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No highlight images yet. Upload the first set to enable the home slider.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden border">
                    <div className="relative h-48 bg-slate-100">
                      {image.imageUrl ? (
                        <img src={image.imageUrl} alt={image.label ?? "Highlight"} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>
                    <CardContent className="space-y-3 pt-4">
                      <div>
                        <Label>Label</Label>
                        <Input
                          defaultValue={image.label ?? ""}
                          placeholder="Optional label"
                          onBlur={(event) => {
                            const next = event.target.value.trim();
                            updateImage.mutate({ id: image.id, payload: { label: next || null } });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Order</Label>
                          <Input
                            type="number"
                            min="0"
                            defaultValue={image.orderIndex ?? 0}
                            onBlur={(event) => {
                              const next = Number(event.target.value);
                              updateImage.mutate({ id: image.id, payload: { orderIndex: Number.isFinite(next) ? next : 0 } });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            defaultValue={image.status ?? "published"}
                            onValueChange={(value) => updateImage.mutate({ id: image.id, payload: { status: value } })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
