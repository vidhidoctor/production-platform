import type { PunchingItemDTO } from "@pp/shared";
import { formatNumber } from "../../../lib/format";
import { DataGrid, type Column } from "../../../components/DataGrid";
import { QueryState } from "../../../components/ui";
import { useOrderDesign } from "../reports.hooks";

const optional = (v: number | null) => (v === null ? <span className="muted">—</span> : formatNumber(v));

/** What Punching entered for the chosen components of the order's design. */
export function ComponentDetails({ designNo, components }: { designNo: string; components: string[] }) {
  const design = useOrderDesign(designNo);

  return (
    <QueryState isPending={design.isPending} error={design.error}>
      {() => {
        const d = design.data!;
        const shown = components.length ? components : [...new Set(d.items.map((i) => i.component))];
        return (
          <>
            {shown.map((c) => {
              const rows = d.items.filter((i) => i.component === c);
              const used = d.materials.filter((m) => rows.some((r) => r.consumption[m.code]));
              const columns: Column<PunchingItemDTO>[] = [
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
              return (
                <div key={c} className="card">
                  <div className="card-header">
                    <h2>Punched details · {c}</h2>
                    <span className="muted">
                      Design {d.designNo} · {d.productName} · consumption per piece
                    </span>
                  </div>
                  <DataGrid columns={columns} rows={rows} rowKey={(r) => r.id} empty={`${c} is no longer in the Punching Master.`} />
                </div>
              );
            })}
          </>
        );
      }}
    </QueryState>
  );
}
