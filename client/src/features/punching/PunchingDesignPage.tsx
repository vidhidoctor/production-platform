import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import type { MaterialColumnDTO, PunchingItemDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useDeleteComponent, useDesign, useUpdateDesign } from "./punching.hooks";
import { ComponentEditor } from "./components/ComponentEditor";

const optional = (v: number | null) => (v === null ? <span className="muted">—</span> : formatNumber(v));

function sizeColumns(materials: MaterialColumnDTO[], rows: PunchingItemDTO[]): Column<PunchingItemDTO>[] {
  // Only the materials this component uses, to keep the table readable.
  const used = materials.filter((m) => rows.some((r) => r.consumption[m.code]));
  return [
    { key: "size", header: "Size", render: (r) => <strong>{r.size}</strong>, sticky: true },
    { key: "stitch", header: "Stitch", align: "right", render: (r) => optional(r.stitch) },
    { key: "laser", header: "Laser", align: "right", render: (r) => optional(r.laser) },
    ...used.map(
      (m): Column<PunchingItemDTO> => ({
        key: m.code,
        header: (
          <>
            {m.name}
            <br />
            <span className="muted">{m.unit} / pc</span>
          </>
        ),
        align: "right",
        render: (r) => (r.consumption[m.code] ? formatNumber(r.consumption[m.code], 3) : "·"),
        cellClass: (r) => (r.consumption[m.code] ? undefined : "zero"),
      }),
    ),
  ];
}

/** One design: its product and every component with its sizes. "Add Another Component" adds more. */
export function PunchingDesignPage() {
  const designNo = useParams().designNo!;
  const [params, setParams] = useSearchParams();
  const { can } = useAuth();
  const design = useDesign(designNo);
  const updateDesign = useUpdateDesign();
  const deleteComponent = useDeleteComponent();
  // "new" = adding a component, string = editing that component
  const [editing, setEditing] = useState<string | null>(params.get("add") ? "new" : null);
  const canEdit = can("PUNCHING_CREATE", "PUNCHING_UPDATE");

  const d = design.data;
  const components = d ? [...new Set(d.items.map((i) => i.component))] : [];
  const rowsOf = (c: string) => d?.items.filter((i) => i.component === c) ?? [];

  function closeEditor() {
    setEditing(null);
    if (params.get("add")) setParams({}, { replace: true });
  }

  function renameProduct() {
    const name = prompt("Product name", d!.productName);
    if (name && name.trim() && name !== d!.productName) updateDesign.mutate({ designNo, productName: name });
  }

  function removeComponent(c: string) {
    if (confirm(`Remove ${c} and all its sizes from design ${designNo}?`)) deleteComponent.mutate({ designNo, component: c });
  }

  return (
    <>
      <PageHeader
        title={`Design ${d?.designNo ?? designNo}`}
        subtitle={
          d ? (
            <>
              {d.productName}
              {can("PUNCHING_UPDATE") && (
                <>
                  {" "}
                  ·{" "}
                  <button className="btn btn-ghost btn-sm" onClick={renameProduct}>
                    Edit product name
                  </button>
                </>
              )}
            </>
          ) : undefined
        }
        actions={
          <>
            <Link className="btn" to="/punching">
              ← All designs
            </Link>
            {canEdit && d && (
              <button className="btn btn-primary" onClick={() => setEditing("new")}>
                {components.length ? "+ Add Another Component" : "+ Add component"}
              </button>
            )}
          </>
        }
      />
      <ErrorAlert error={updateDesign.error ?? deleteComponent.error} />
      <QueryState isPending={design.isPending} error={design.error}>
        {() => (
          <>
            {components.length === 0 && (
              <div className="card">
                <div className="card-body">
                  <h2>No components yet</h2>
                  <p className="muted">Add the first component (e.g. Kali) with its sizes and consumption.</p>
                </div>
              </div>
            )}
            {components.map((c) => (
              <div key={c} className="card">
                <div className="card-header">
                  <h2>{c}</h2>
                  <span className="muted">
                    {rowsOf(c).length} size(s): {rowsOf(c).map((r) => r.size).join(", ")}
                  </span>
                  <span className="spacer" />
                  {canEdit && (
                    <button className="btn btn-sm" onClick={() => setEditing(c)}>
                      Edit {c}
                    </button>
                  )}
                  {can("PUNCHING_UPDATE") && (
                    <button className="btn btn-sm btn-danger" onClick={() => removeComponent(c)}>
                      Remove
                    </button>
                  )}
                </div>
                <DataGrid columns={sizeColumns(d!.materials, rowsOf(c))} rows={rowsOf(c)} rowKey={(r) => r.id} />
              </div>
            ))}
          </>
        )}
      </QueryState>
      {editing && d && (
        <ComponentEditor
          designNo={d.designNo}
          materials={d.materials}
          existing={components}
          component={editing === "new" ? undefined : editing}
          rows={editing === "new" ? undefined : rowsOf(editing)}
          onClose={closeEditor}
        />
      )}
    </>
  );
}
