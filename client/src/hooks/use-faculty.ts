import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useFaculty(status?: string) {
  return useQuery({
    queryKey: [api.faculty.list.path, status],
    queryFn: async () => {
      const url = new URL(api.faculty.list.path, window.location.origin);
      if (status) url.searchParams.append("status", status);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch faculty");
      return api.faculty.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.faculty.create.input>) => {
      const res = await fetch(api.faculty.create.path, {
        method: api.faculty.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create faculty profile");
      return api.faculty.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.faculty.list.path] }),
  });
}

export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.faculty.update.input>>) => {
      const url = buildUrl(api.faculty.update.path, { id });
      const res = await fetch(url, {
        method: api.faculty.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update faculty profile");
      return api.faculty.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.faculty.list.path] }),
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.faculty.delete.path, { id });
      const res = await fetch(url, {
        method: api.faculty.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete faculty profile");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.faculty.list.path] }),
  });
}
