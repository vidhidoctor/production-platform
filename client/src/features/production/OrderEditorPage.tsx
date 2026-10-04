import { Link, useNavigate, useParams } from "react-router";
import { PageHeader, QueryState } from "../../components/ui";
import { useCatalog, useOrder, useUpdateOrder } from "./production.hooks";
import { OrderForm } from "./components/OrderForm";

/** /production/orders/:id/edit — new orders are created from the design page. */
export function OrderEditorPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const catalog = useCatalog();
  const order = useOrder(id);
  const save = useUpdateOrder();
  const back = `/production/orders/${id}`;

  return (
    <>
      <PageHeader title={`Edit order #${id}`} subtitle={<Link to={back}>← Back</Link>} />
      <QueryState isPending={catalog.isPending || order.isPending} error={catalog.error ?? order.error}>
        {() => (
          <OrderForm
            initial={order.data!}
            catalog={catalog.data!}
            saving={save.isPending}
            error={save.error}
            onCancel={() => navigate(back)}
            onSubmit={(body) => save.mutate({ id, body }, { onSuccess: () => navigate(back) })}
          />
        )}
      </QueryState>
    </>
  );
}
