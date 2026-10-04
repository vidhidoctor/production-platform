import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateOrderInput, OrderStatus, UpdateOrderInput } from "@pp/shared";
import { productionApi } from "./production.api";

export const useDesignSearch = (q: string) =>
  useQuery({
    queryKey: ["production", "designs", "search", q],
    queryFn: () => productionApi.searchDesigns(q),
    placeholderData: keepPreviousData, // keep showing results while typing
  });

export const useDesign = (designNo: string) =>
  useQuery({ queryKey: ["production", "designs", designNo], queryFn: () => productionApi.design(designNo) });

export const useCatalog = () => useQuery({ queryKey: ["production", "catalog"], queryFn: productionApi.catalog });

export const useOrders = () => useQuery({ queryKey: ["production", "orders"], queryFn: productionApi.list });

export const useOrder = (id: number | undefined) =>
  useQuery({ queryKey: ["production", "orders", id], queryFn: () => productionApi.get(id!), enabled: !!id });

export const useOrderSummary = (id: number) =>
  useQuery({ queryKey: ["production", "orders", id, "summary"], queryFn: () => productionApi.summary(id) });

// Orders feed the design history, requirements and reports, so refresh all of them.
function useOrderMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export const useCreateOrder = () => useOrderMutation((body: CreateOrderInput) => productionApi.create(body));

export const useUpdateOrder = () =>
  useOrderMutation(({ id, body }: { id: number; body: UpdateOrderInput }) => productionApi.update(id, body));

export const useSetOrderStatus = () =>
  useOrderMutation(({ id, status }: { id: number; status: OrderStatus }) => productionApi.setStatus(id, status));
