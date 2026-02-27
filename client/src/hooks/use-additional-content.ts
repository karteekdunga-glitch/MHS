import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { AdmissionStatus } from "@/types/admissions";

export type StudentLifeImage = {
  id: number;
  studentLifeId: number;
  imageUrl: string;
  orderIndex?: number | null;
};

export type StudentLifeEntry = {
  id: number;
  title: string;
  description: string;
  highlightTag?: string | null;
  status: string;
  createdAt?: string;
  images: StudentLifeImage[];
};

export function useAcademics(status?: string, category?: string) {
  return useQuery({
    queryKey: [api.academics.list.path, status, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (category) params.append("category", category);
      const res = await fetch(`${api.academics.list.path}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch academics");
      return res.json();
    },
  });
}

export function useStudentLife(status?: string) {
  return useQuery({
    queryKey: [api.studentLife.list.path, status],
    queryFn: async () => {
      const url = status ? `${api.studentLife.list.path}?status=${status}` : api.studentLife.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch student life");
      const data = await res.json();
      return (data as StudentLifeEntry[]) ?? [];
    },
  });
}

export type AdmissionFilters = {
  status?: AdmissionStatus;
  classLevel?: string;
  academicYear?: string;
  search?: string;
};

export function useAdmissions(filters?: AdmissionFilters, options?: { refetchInterval?: number }) {
  const serialized = filters ? JSON.stringify(filters) : "all";
  return useQuery({
    queryKey: [api.admissions.list.path, serialized],
    queryFn: async () => {
      const url = new URL(api.admissions.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value);
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admissions");
      return res.json();
    },
    refetchInterval: options?.refetchInterval ?? 5000,
  });
}

type ResultFilters = {
  rollNo?: string | null;
  className?: string | null;
};

export function useResults(filters?: ResultFilters, options?: { fetchAll?: boolean }) {
  const normalizedRoll = filters?.rollNo?.trim();
  const normalizedClass = filters?.className?.trim();
  const allowFetchAll = options?.fetchAll ?? filters === undefined;
  const hasFilters = Boolean(normalizedRoll || normalizedClass);

  return useQuery({
    queryKey: [
      api.results.list.path,
      normalizedRoll ?? (allowFetchAll ? "all" : "none"),
      normalizedClass ?? (allowFetchAll ? "all" : "none"),
    ],
    queryFn: async () => {
      const url = new URL(api.results.list.path, window.location.origin);
      if (normalizedRoll) url.searchParams.set("rollNo", normalizedRoll);
      if (normalizedClass) url.searchParams.set("className", normalizedClass);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    enabled: allowFetchAll || hasFilters,
  });
}

export function useBulkCreateResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await fetch(api.results.bulkCreate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload results");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.results.list.path] }),
  });
}

export function useDeleteResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.results.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete result");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.results.list.path] }),
  });
}

export type AcademicDocFilters = {
  status?: string;
  docType?: string;
  academicYear?: string;
  classLevel?: string;
  subject?: string;
};

export function useAcademicDocuments(filters?: AcademicDocFilters, options?: { enabled?: boolean }) {
  const serialized = filters ? JSON.stringify(filters) : "all";
  return useQuery({
    queryKey: [api.academicDocs.list.path, serialized],
    queryFn: async () => {
      const url = new URL(api.academicDocs.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value);
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch academic documents");
      return res.json();
    },
    enabled: options?.enabled ?? true,
  });
}

export function useUploadAcademicDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData) => {
      const res = await fetch(api.academicDocs.create.path, {
        method: "POST",
        body: payload,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to upload document");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.academicDocs.list.path] }),
  });
}

export function useUpdateAcademicDocStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "draft" | "published" }) => {
      const url = buildUrl(api.academicDocs.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.academicDocs.list.path] }),
  });
}

export function useDeleteAcademicDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.academicDocs.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete document");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.academicDocs.list.path] }),
  });
}

export function useCreateStudentLifeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.studentLife.create.path, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create student life entry");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.studentLife.list.path] }),
  });
}

export function useUpdateStudentLifeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const url = buildUrl(api.studentLife.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update student life entry");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.studentLife.list.path] }),
  });
}

export function useDeleteStudentLifeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.studentLife.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete student life entry");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.studentLife.list.path] }),
  });
}

export function useSubmitAdmissionEnquiry() {
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(api.admissions.publicCreate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to submit admission enquiry");
      }
      return res.json();
    },
  });
}

export function useCreateAdmissionRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(api.admissions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create admission");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admissions.list.path] }),
  });
}

export function useUpdateAdmissionRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const url = buildUrl(api.admissions.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update admission");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admissions.list.path] }),
  });
}

export function useUpdateAdmissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, expectedJoinDate }: { id: number; status: AdmissionStatus; expectedJoinDate?: string | null }) => {
      const url = buildUrl(api.admissions.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, expectedJoinDate }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admissions.list.path] }),
  });
}

export function useDeleteAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admissions.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete admission");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.admissions.list.path] }),
  });
}
