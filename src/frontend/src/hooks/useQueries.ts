import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface UserProfile {
  username?: string;
  displayName?: string;
  name?: string;
  bio?: string;
}

// User Profile — backend may not have these methods yet; graceful fallback
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await (
          actor as unknown as {
            getCallerUserProfile: () => Promise<UserProfile | null>;
          }
        ).getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as {
          saveCallerUserProfile: (p: UserProfile) => Promise<void>;
        }
      ).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// API Key Management
export function useGetApiKey() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["apiKey"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await (
          actor as unknown as { getApiKey: () => Promise<string | null> }
        ).getApiKey();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveApiKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as { saveApiKey: (k: string) => Promise<void> }
      ).saveApiKey(apiKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKey"] });
    },
  });
}

// Workflow State
export function useGetWorkflowState() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ["workflowState"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await (
          actor as unknown as { getWorkflowState: () => Promise<string | null> }
        ).getWorkflowState();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveWorkflowState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (state: string) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as { saveWorkflowState: (s: string) => Promise<void> }
      ).saveWorkflowState(state);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflowState"] });
    },
  });
}

// Agent Results
export function useGetAgentResults() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, string]>>({
    queryKey: ["agentResults"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const results = await (
          actor as unknown as {
            getAgentResults: () => Promise<
              Array<[{ toString: () => string }, string]>
            >;
          }
        ).getAgentResults();
        return results.map(
          ([principal, data]) =>
            [principal.toString(), data] as [string, string],
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveAgentResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      result,
    }: { agentId: string; result: string }) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as {
          saveAgentResult: (id: string, r: string) => Promise<void>;
        }
      ).saveAgentResult(agentId, result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentResults"] });
    },
  });
}
