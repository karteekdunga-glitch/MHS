import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useFaculty, useCreateFaculty, useUpdateFaculty, useDeleteFaculty } from "@/hooks/use-faculty";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Pencil, Trash2, UploadCloud } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { cropImageToFile } from "@/lib/crop-image";

const displayValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") return value.toString();
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "-";
};

const displayRoleDepartment = (role?: string | null, department?: string | null) => {
  const roleText = displayValue(role);
  const deptText = displayValue(department);
  if (roleText === "-" && deptText === "-") return "-";
  if (roleText === "-") return deptText;
  if (deptText === "-") return roleText;
  return `${roleText} - ${deptText}`;
};

type FacultyFormState = {
  name: string;
  role: string;
  department: string;
  qualification: string;
  experience: string;
  description: string;
  email: string;
  phone: string;
  status: "draft" | "published";
  imageSourceType: "url" | "upload";
  imageUrl: string;
};

const DEFAULT_FORM: FacultyFormState = {
  name: "",
  role: "",
  department: "",
  qualification: "",
  experience: "",
  description: "",
  email: "",
  phone: "",
  status: "draft",
  imageSourceType: "url",
  imageUrl: "",
};

export default function AdminFaculty() {
  const { data: faculty = [], isLoading } = useFaculty();
  const createMutation = useCreateFaculty();
  const updateMutation = useUpdateFaculty();
  const deleteMutation = useDeleteFaculty();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FacultyFormState>(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const publishedCount = useMemo(() => faculty?.filter((member: any) => member.status === "published").length ?? 0, [faculty]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    if (formState.imageSourceType !== "upload") {
      setIsCropping(false);
      setSelectedFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [formState.imageSourceType]);

  const resetDialogState = () => {
    setFormState(DEFAULT_FORM);
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFormError(null);
    setEditingRecord(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setIsCropping(false);
    setIsApplyingCrop(false);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    resetDialogState();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingId(item.id);
    setEditingRecord(item);
    setFormState({
      name: item.name,
      role: item.role,
      department: item.department,
      qualification: item.qualification ?? "",
      experience: item.experience ?? "",
      description: item.description ?? "",
      email: item.email ?? "",
      phone: item.phone ?? "",
      status: item.status ?? "draft",
      imageSourceType: (item.imageSourceType as "url" | "upload") ?? "url",
      imageUrl: item.imageUrl ?? "",
    });
    if (preview) URL.revokeObjectURL(preview);
    setPreview(item.imageUrl ?? null);
    setSelectedFile(null);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetDialogState();
    setEditingId(null);
  };

  const handleFileChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (preview) URL.revokeObjectURL(preview);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSelectedFile(file);
    setIsCropping(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
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
        selectedFile?.name ?? "faculty-photo.jpg",
        selectedFile?.type ?? "image/jpeg",
      );
      setSelectedFile(croppedFile);
      setPreview(URL.createObjectURL(croppedFile));
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

  const validateForm = () => {
    if (!formState.name.trim() || !formState.role.trim() || !formState.department.trim()) {
      setFormError("Name, role, and department are required.");
      return false;
    }
    if (formState.imageSourceType === "url" && !formState.imageUrl.trim()) {
      setFormError("Provide an image URL or switch to image upload.");
      return false;
    }
    const requiresUpload =
      formState.imageSourceType === "upload" &&
      (!editingId || (editingRecord && editingRecord.imageSourceType !== "upload"));
    if (requiresUpload && !selectedFile) {
      setFormError("Upload an image file for this profile.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const buildFormData = () => {
    const payload = {
      ...formState,
      name: formState.name.trim(),
      role: formState.role.trim(),
      department: formState.department.trim(),
      qualification: formState.qualification.trim() || undefined,
      experience: formState.experience.trim() || undefined,
      description: formState.description.trim() || undefined,
      email: formState.email.trim() || undefined,
      phone: formState.phone.trim() || undefined,
      imageUrl: formState.imageSourceType === "url" ? formState.imageUrl.trim() : undefined,
    };
    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    if (selectedFile) {
      formData.append("image", selectedFile);
    }
    return formData;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    const formData = buildFormData();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast({ title: "Faculty profile updated." });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Faculty profile created." });
      }
      closeDialog();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save faculty profile.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this faculty profile?")) return;
    await deleteMutation.mutateAsync(id);
    toast({ title: "Faculty profile removed." });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Faculty Profiles
            </h2>
            <p className="text-muted-foreground">
              Manage staff profiles and highlight their expertise across the school website.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setIsDialogOpen(true))}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" /> Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Faculty Profile" : "Add Faculty Profile"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      required
                      value={formState.name}
                      onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input
                      required
                      value={formState.role}
                      onChange={(e) => setFormState((prev) => ({ ...prev, role: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      required
                      value={formState.department}
                      onChange={(e) => setFormState((prev) => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formState.status}
                      onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as "draft" | "published" }))}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Qualification</Label>
                    <Input
                      value={formState.qualification}
                      onChange={(e) => setFormState((prev) => ({ ...prev, qualification: e.target.value }))}
                      placeholder="M.Sc, B.Ed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience (years or details)</Label>
                    <Input
                      value={formState.experience}
                      onChange={(e) => setFormState((prev) => ({ ...prev, experience: e.target.value }))}
                      placeholder="12 years"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio / Description</Label>
                  <Textarea
                    value={formState.description}
                    onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Share achievements, teaching approach, awards, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="faculty@montessori.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formState.phone}
                      onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 90000 00000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Photo Source</Label>
                  <Select
                    value={formState.imageSourceType}
                    onValueChange={(value) => {
                      setFormState((prev) => ({ ...prev, imageSourceType: value as "url" | "upload" }));
                      if (value === "url") {
                        setSelectedFile(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">Use Image URL</SelectItem>
                      <SelectItem value="upload">Upload Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formState.imageSourceType === "url" ? (
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={formState.imageUrl}
                      onChange={(e) => setFormState((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload Faculty Photo</Label>
                    <div className="border border-dashed rounded-xl p-6 text-center">
                      <UploadCloud className="h-8 w-8 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a square image (minimum 400x400). PNG or JPEG preferred.
                      </p>
                      <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
                    </div>
                  </div>
                )}

                {preview && formState.imageSourceType === "upload" && selectedFile ? (
                  <div className="space-y-3">
                    <Label>{isCropping ? "Adjust Crop" : "Preview"}</Label>
                    {isCropping ? (
                      <>
                        <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-slate-200">
                          <Cropper
                            image={preview}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
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
                      <>
                        <img src={preview} alt="Preview" className="h-40 w-40 rounded-full object-cover border shadow" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsCropping(true);
                            setCrop({ x: 0, y: 0 });
                            setZoom(1);
                            setCroppedAreaPixels(null);
                          }}
                        >
                          Adjust Crop
                        </Button>
                      </>
                    )}
                  </div>
                ) : preview ? (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <img src={preview} alt="Preview" className="h-40 w-40 rounded-full object-cover border" />
                  </div>
                ) : null}

                {formError && <p className="text-sm text-destructive">{formError}</p>}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save Changes" : "Create Profile"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Faculty Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              {publishedCount} published / {faculty?.length ?? 0} total
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : faculty && faculty.length > 0 ? (
                  faculty.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {displayRoleDepartment(item.role, item.department)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{displayValue(item.qualification)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.experience ? displayValue(item.experience) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{displayValue(item.email)}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.phone ? displayValue(item.phone) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs",
                            item.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                          )}
                        >
                          {item.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No faculty profiles yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
