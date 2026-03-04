import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { HeadmasterMessage } from "@shared/schema";

const HEADMASTER_QUERY_KEY = api.headmaster.list.path;

export function useHeadmasterMessages(status?: string) {
  return useQuery({
    queryKey: [HEADMASTER_QUERY_KEY, status ?? "all"],
    queryFn: async (): Promise<HeadmasterMessage[]> => {
      const url = new URL(api.headmaster.list.path, window.location.origin);
      if (status) {
        url.searchParams.set("status", status);
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load headmaster messages");
      }
      return res.json();
    },
  });
}

export function useCreateHeadmasterMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.headmaster.create.path, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create Head Master message");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [HEADMASTER_QUERY_KEY] }),
  });
}

export function useUpdateHeadmasterMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const url = buildUrl(api.headmaster.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update Head Master message");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [HEADMASTER_QUERY_KEY] }),
  });
}

export function useDeleteHeadmasterMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.headmaster.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete Head Master message");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [HEADMASTER_QUERY_KEY] }),
  });
}
