import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useActor } from "../../hooks/useActor";
import { CAREER_LEVEL_FORMULA } from "../utils/Constants";

export interface GameState {
  totalXP: number;
  careerLevel: number;
}

export function useGameState(): GameState & {
  addXP: (amount: number) => void;
} {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [localXP, setLocalXP] = useState(0);

  const { data: backendXP } = useQuery<number>({
    queryKey: ["gameXP"],
    queryFn: async () => {
      if (!actor) return 0;
      try {
        const result = await (
          actor as unknown as { getXP: () => Promise<bigint> }
        ).getXP();
        return Number(result);
      } catch {
        return 0;
      }
    },
    enabled: !!actor && !isFetching,
  });

  const addXPMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!actor) return;
      try {
        await (
          actor as unknown as { addXP: (n: bigint) => Promise<void> }
        ).addXP(BigInt(amount));
      } catch {
        // Backend XP optional — keep local state
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gameXP"] });
    },
  });

  const totalXP = backendXP ?? localXP;
  const careerLevel = CAREER_LEVEL_FORMULA(totalXP);

  const addXP = useCallback(
    (amount: number) => {
      setLocalXP((prev) => prev + amount);
      addXPMutation.mutate(amount);
    },
    [addXPMutation],
  );

  return { totalXP, careerLevel, addXP };
}
