import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useAnnouncements(status?: string) {
  return useQuery({
    queryKey: [api.announcements.list.path, status],
    queryFn: async () => {
      const url = new URL(api.announcements.list.path, window.location.origin);
      if (status) url.searchParams.append("status", status);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return api.announcements.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.announcements.create.input>) => {
      const res = await fetch(api.announcements.create.path, {
        method: api.announcements.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      return api.announcements.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.announcements.list.path] }),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.announcements.update.input>>) => {
      const url = buildUrl(api.announcements.update.path, { id });
      const res = await fetch(url, {
        method: api.announcements.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update announcement");
      return api.announcements.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.announcements.list.path] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.announcements.delete.path, { id });
      const res = await fetch(url, {
        method: api.announcements.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.announcements.list.path] }),
  });
}
