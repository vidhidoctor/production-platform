import { useState } from "react";
import { useNavigate } from "react-router";
import { Modal } from "../../../components/Modal";
import { ErrorAlert, Field } from "../../../components/ui";
import { useCreateDesign } from "../punching.hooks";

/** Step 1 of Punching: create the design (parent record), then add its components on the design page. */
export function NewDesignDialog({ products, onClose }: { products: string[]; onClose: () => void }) {
  const navigate = useNavigate();
  const create = useCreateDesign();
  const [designNo, setDesignNo] = useState("");
  const [productName, setProductName] = useState("");

  function submit() {
    create.mutate(
      { designNo, productName },
      { onSuccess: (d) => navigate(`/punching/designs/${encodeURIComponent(d.designNo)}?add=1`) },
    );
  }

  return (
    <Modal
      open
      width={480}
      title="New design"
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={create.isPending}>
            Create and add components
          </button>
        </>
      }
    >
      <ErrorAlert error={create.error} />
      <Field label="Design Number" hint="e.g. 26-2004">
        <input className="input" required autoFocus value={designNo} onChange={(e) => setDesignNo(e.target.value)} />
      </Field>
      <Field label="Product name" hint="e.g. Lehenga Choli, Plazo — shared by all components of the design">
        <input className="input" required list="nd-products" value={productName} onChange={(e) => setProductName(e.target.value)} />
      </Field>
      <datalist id="nd-products">
        {products.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </Modal>
  );
}
