import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ComponentRowInput } from "@pp/shared";
import { punchingApi } from "./punching.api";

export const useDesigns = () => useQuery({ queryKey: ["punching", "designs"], queryFn: punchingApi.designs });

export const useDesign = (designNo: string) =>
  useQuery({ queryKey: ["punching", "designs", designNo], queryFn: () => punchingApi.design(designNo) });

// Punching data feeds the order screens and every calculation, so refresh those too.
function usePunchingMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["punching"] });
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export const useCreateDesign = () =>
  usePunchingMutation((body: { designNo: string; productName: string }) => punchingApi.createDesign(body));

export const useUpdateDesign = () =>
  usePunchingMutation(({ designNo, productName }: { designNo: string; productName: string }) =>
    punchingApi.updateDesign(designNo, productName),
  );

export const useSaveComponent = () =>
  usePunchingMutation(({ designNo, component, rows }: { designNo: string; component: string; rows: ComponentRowInput[] }) =>
    punchingApi.saveComponent(designNo, component, rows),
  );

export const useDeleteComponent = () =>
  usePunchingMutation(({ designNo, component }: { designNo: string; component: string }) =>
    punchingApi.deleteComponent(designNo, component),
  );
