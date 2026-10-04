import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MaterialInput } from "@pp/shared";
import { materialsApi } from "./materials.api";

export const useMaterialMaster = () => useQuery({ queryKey: ["materials", "master"], queryFn: materialsApi.master });

// Materials are the Punching Master's columns and feed every calculation, so refresh all of it.
function useMaterialMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      qc.invalidateQueries({ queryKey: ["punching"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export const useSaveMaterial = () =>
  useMaterialMutation(({ id, body }: { id?: number; body: MaterialInput }) =>
    id ? materialsApi.update(id, body) : materialsApi.create(body),
  );

export const useRemoveMaterial = () => useMaterialMutation((id: number) => materialsApi.remove(id));
