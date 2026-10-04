import { useState } from "react";
import { CORD_DIVISOR, unitFor, type MaterialDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useMaterialMaster, useRemoveMaterial } from "./materials.hooks";
import { MaterialForm } from "./components/MaterialForm";

function rule(m: MaterialDTO) {
  switch (m.category) {
    case "SEQUENCE":
      return `${formatNumber(m.seqPerCd)} seq / CD · ${formatNumber(m.cdPerRoll)} CD / roll`;
    case "BEAD":
      return `${formatNumber(m.pcsPerKg)} pcs / KG`;
    case "CORD":
      return `MTR × ${formatNumber(m.denier)} denier ÷ ${CORD_DIVISOR} = grams`;
  }
}

export function MaterialMasterPage() {
  const { can } = useAuth();
  const master = useMaterialMaster();
  const remove = useRemoveMaterial();
  const [editing, setEditing] = useState<MaterialDTO | "new" | null>(null);
  const canManage = can("MATERIAL_MASTER_MANAGE");

  function confirmRemove(m: MaterialDTO) {
    if (confirm(`Remove ${m.name} (${m.code})? Its column disappears from the Punching Master.`)) remove.mutate(m.id);
  }

  const columns: Column<MaterialDTO>[] = [
    { key: "pos", header: "#", align: "right", render: (m) => <span className="muted">{m.sortOrder}</span> },
    { key: "code", header: "Code", render: (m) => <code>{m.code}</code> },
    { key: "name", header: "Material", render: (m) => <strong>{m.name}</strong> },
    { key: "category", header: "Category", render: (m) => <span className="badge badge-primary">{m.category}</span> },
    { key: "unit", header: "Measured in", render: (m) => unitFor(m.category) },
    { key: "rule", header: "Conversion rule", render: (m) => rule(m) },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            render: (m: MaterialDTO) => (
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button className="btn btn-sm" onClick={() => setEditing(m)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => confirmRemove(m)}>
                  Remove
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Material Master"
        subtitle="The consumption columns of the Punching Master, and how each converts to purchase units."
        actions={
          canManage && (
            <button className="btn btn-primary" onClick={() => setEditing("new")}>
              + Add material
            </button>
          )
        }
      />
      <ErrorAlert error={remove.error} />
      <QueryState isPending={master.isPending} error={master.error}>
        {() => (
          <div className="card">
            <DataGrid columns={columns} rows={master.data!} rowKey={(m) => m.id} />
          </div>
        )}
      </QueryState>
      {editing && <MaterialForm material={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
