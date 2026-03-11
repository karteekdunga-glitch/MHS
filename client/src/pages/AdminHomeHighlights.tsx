import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UploadCloud, Trash2, Plus, Crop as CropIcon, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Cropper, { type Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { cropImageToFile } from "@/lib/crop-image";
import {
  useGlobalImages,
  useCreateGlobalImages,
  useUpdateGlobalImage,
  useDeleteGlobalImage,
  type GlobalImage,
} from "@/hooks/use-additional-content";

const HIGHLIGHT_ASPECT = 16 / 6;

type CropSession = {
  targetId: number | null;
  sourceUrl: string;
  fileName: string;
  mimeType: string;
  mode: "create" | "update";
};

export default function AdminHomeHighlights() {
  const { data: images = [], isLoading } = useGlobalImages();
  const createImages = useCreateGlobalImages();
  const updateImage = useUpdateGlobalImage();
  const deleteImage = useDeleteGlobalImage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [url, setUrl] = useState("");
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);
  const [cropSession, setCropSession] = useState<CropSession | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const sortedImages = useMemo(() => {
    return [...(images as GlobalImage[])].sort(
      (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );
  }, [images]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    return () => {
      if (cropSession?.sourceUrl.startsWith("blob:")) {
        URL.revokeObjectURL(cropSession.sourceUrl);
      }
    };
  }, [cropSession]);

  const resetCropState = () => {
    if (cropSession?.sourceUrl.startsWith("blob:")) {
      URL.revokeObjectURL(cropSession.sourceUrl);
    }
    setCropSession(null);
    setReplaceTargetId(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const openCropDialog = ({
    sourceUrl,
    fileName,
    mimeType,
    mode,
    targetId = null,
  }: CropSession) => {
    setCropSession({ sourceUrl, fileName, mimeType, mode, targetId });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleUploadSelection = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file) return;
    if ((files?.length ?? 0) > 1) {
      toast({
        title: "One image at a time",
        description: "Home highlight crop works one image at a time so the slider framing stays accurate.",
      });
    }
    openCropDialog({
      sourceUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type || "image/jpeg",
      mode: "create",
      targetId: null,
    });
  };

  const handleReplaceSelection = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (!file || !replaceTargetId) return;
    openCropDialog({
      sourceUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type || "image/jpeg",
      mode: "update",
      targetId: replaceTargetId,
    });
  };

  const handleApplyCrop = async () => {
    if (!cropSession || !croppedAreaPixels) return;
    try {
      setIsApplyingCrop(true);
      const croppedFile = await cropImageToFile(
        cropSession.sourceUrl,
        croppedAreaPixels,
        cropSession.fileName,
        cropSession.mimeType,
      );

      if (cropSession.mode === "create") {
        const formData = new FormData();
        formData.append("images", croppedFile);
        formData.append("status", "published");
        await createImages.mutateAsync(formData);
        toast({ title: "Highlight image uploaded" });
      } else if (cropSession.targetId) {
        const formData = new FormData();
        formData.append("image", croppedFile);
        formData.append("imageSourceType", "upload");
        await updateImage.mutateAsync({ id: cropSession.targetId, payload: formData });
        toast({ title: "Highlight image updated" });
      }
      resetCropState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to apply crop";
      toast({ variant: "destructive", title: "Crop failed", description: message });
    } finally {
      setIsApplyingCrop(false);
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
                className="sr-only"
                onChange={(event) => handleUploadSelection(event.target.files)}
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => handleReplaceSelection(event.target.files)}
              />
              <Button
                type="button"
                className="gap-2 w-full sm:w-auto"
                onClick={() => fileInputRef.current?.click()}
                disabled={createImages.isPending}
              >
                {createImages.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Upload & Crop
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
              Upload one image at a time to crop it to the home slider frame, or add a remote image URL. Images are shown in slider order.
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
                    <div className="relative h-48 overflow-hidden bg-[#041737]">
                      {image.imageUrl ? (
                        <>
                          <img
                            src={image.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-105 object-cover object-center opacity-35 blur-sm"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#041737]/20 via-transparent to-[#041737]/20" />
                          <img
                            src={image.imageUrl}
                            alt={image.label ?? "Highlight"}
                            className="relative z-10 h-full w-full object-contain object-center"
                          />
                        </>
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
                      {image.imageUrl && image.imageSourceType === "upload" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() =>
                              openCropDialog({
                                sourceUrl: image.imageUrl as string,
                                fileName: `${image.label || `highlight-${image.id}`}.jpg`,
                                mimeType: "image/jpeg",
                                mode: "update",
                                targetId: image.id,
                              })
                            }
                          >
                            <CropIcon className="h-4 w-4" /> Recrop Current
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => {
                              setReplaceTargetId(image.id);
                              replaceInputRef.current?.click();
                            }}
                          >
                            <ImagePlus className="h-4 w-4" /> Replace Image
                          </Button>
                        </div>
                      )}
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
      <Dialog open={Boolean(cropSession)} onOpenChange={(open) => (!open ? resetCropState() : undefined)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {cropSession?.mode === "update" ? "Crop Highlight Image" : "Crop and Upload Highlight"}
            </DialogTitle>
          </DialogHeader>
          {cropSession && (
            <div className="space-y-4 pt-2">
              <div className="relative mx-auto aspect-[16/6] w-full overflow-hidden rounded-2xl bg-slate-900">
                <Cropper
                  image={cropSession.sourceUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={HIGHLIGHT_ASPECT}
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
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetCropState}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleApplyCrop} disabled={isApplyingCrop || !croppedAreaPixels}>
                  {isApplyingCrop ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Crop"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
