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

export function useEvents(status?: string) {
  return useQuery({
    queryKey: [api.events.list.path, status],
    queryFn: async () => {
      const url = new URL(api.events.list.path, window.location.origin);
      if (status) url.searchParams.append("status", status);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      return parseWithLogging(api.events.list.responses[200], data, "events.list");
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.events.create.input>) => {
      const validated = api.events.create.input.parse(data);
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create event");
      return parseWithLogging(api.events.create.responses[201], await res.json(), "events.create");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.events.list.path] }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<z.infer<typeof api.events.update.input>>) => {
      const url = buildUrl(api.events.update.path, { id });
      const res = await fetch(url, {
        method: api.events.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update event");
      return parseWithLogging(api.events.update.responses[200], await res.json(), "events.update");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.events.list.path] }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.delete.path, { id });
      const res = await fetch(url, {
        method: api.events.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.events.list.path] }),
  });
}
