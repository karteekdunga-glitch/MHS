import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useGallery(status?: string) {
  return useQuery({
    queryKey: [api.gallery.list.path, status],
    queryFn: async () => {
      const url = new URL(api.gallery.list.path, window.location.origin);
      if (status) url.searchParams.append("status", status);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch gallery images");
      return api.gallery.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.gallery.create.input>) => {
      const res = await fetch(api.gallery.create.path, {
        method: api.gallery.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create gallery image");
      return api.gallery.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.gallery.list.path] }),
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.gallery.update.input>>) => {
      const url = buildUrl(api.gallery.update.path, { id });
      const res = await fetch(url, {
        method: api.gallery.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update gallery image");
      return api.gallery.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.gallery.list.path] }),
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.gallery.delete.path, { id });
      const res = await fetch(url, {
        method: api.gallery.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete gallery image");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.gallery.list.path] }),
  });
}
