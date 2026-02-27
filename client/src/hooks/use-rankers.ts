import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useRankers(status?: string) {
  return useQuery({
    queryKey: [api.rankers.list.path, status],
    queryFn: async () => {
      const url = new URL(api.rankers.list.path, window.location.origin);
      if (status) url.searchParams.append("status", status);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch rankers");
      return parseWithLogging(api.rankers.list.responses[200], await res.json(), "rankers.list");
    },
  });
}

export function useCreateRanker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.rankers.create.input>) => {
      const validated = api.rankers.create.input.parse(data);
      const res = await fetch(api.rankers.create.path, {
        method: api.rankers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create ranker");
      return parseWithLogging(api.rankers.create.responses[201], await res.json(), "rankers.create");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.rankers.list.path] }),
  });
}

export function useUpdateRanker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.rankers.update.input>>) => {
      const url = buildUrl(api.rankers.update.path, { id });
      const res = await fetch(url, {
        method: api.rankers.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update ranker");
      return parseWithLogging(api.rankers.update.responses[200], await res.json(), "rankers.update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.rankers.list.path] }),
  });
}

export function useDeleteRanker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.rankers.delete.path, { id });
      const res = await fetch(url, {
        method: api.rankers.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete ranker");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.rankers.list.path] }),
  });
}

export function useUploadRankerPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const url = buildUrl(api.rankers.uploadPhoto.path, { id });
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload photo");
      return parseWithLogging(api.rankers.uploadPhoto.responses[200], await res.json(), "rankers.photo");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.rankers.list.path] }),
  });
}
