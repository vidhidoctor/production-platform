import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { reportsApi, type ReportKind, type Scope } from "./reports.api";

const scopeKey = (s: Scope) => [s.orderId ?? "all", s.components.join(",")];

// Keep showing the previous figures while a new order / component choice loads (no flash).
export const useMaterialRequirements = (scope: Scope) =>
  useQuery({
    queryKey: ["reports", "material-req", ...scopeKey(scope)],
    queryFn: () => reportsApi.materialRequirements(scope),
    placeholderData: keepPreviousData,
  });

export const usePurchaseRequirements = (scope: Scope) =>
  useQuery({
    queryKey: ["reports", "purchase-req", ...scopeKey(scope)],
    queryFn: () => reportsApi.purchaseRequirements(scope),
    placeholderData: keepPreviousData,
  });

export const useReport = (kind: ReportKind) => useQuery({ queryKey: ["reports", kind], queryFn: () => reportsApi.report(kind) });

export const useOrderChoices = (enabled: boolean) =>
  useQuery({ queryKey: ["production", "orders"], queryFn: reportsApi.orders, enabled });

export const useOrderDesign = (designNo: string | undefined) =>
  useQuery({
    queryKey: ["production", "designs", designNo],
    queryFn: () => reportsApi.design(designNo!),
    enabled: !!designNo,
  });

/**
 * ?orderId=N&components=KALI,GALISH in the URL, so a view can be linked and bookmarked.
 * No order = all orders combined; no components = every component.
 */
export function useScopeParams(): [Scope, (next: Scope) => void] {
  const [params, setParams] = useSearchParams();
  const scope: Scope = {
    orderId: Number(params.get("orderId")) || undefined,
    components: (params.get("components") ?? "").split(",").filter(Boolean),
  };
  const set = ({ orderId, components }: Scope) => {
    const next: Record<string, string> = {};
    if (orderId) next.orderId = String(orderId);
    if (orderId && components.length) next.components = components.join(",");
    setParams(next, { replace: true });
  };
  return [scope, set];
}
