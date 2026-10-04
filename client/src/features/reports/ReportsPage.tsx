import { useState } from "react";
import type { PermissionCode, ReportRowDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, Forbidden, PageHeader, QueryState } from "../../components/ui";
import { reportsApi, type ReportKind } from "./reports.api";
import { useReport } from "./reports.hooks";

const TABS: { kind: ReportKind; label: string; perm: PermissionCode; about: string }[] = [
  { kind: "production", label: "Production", perm: "PRODUCTION_REPORT_VIEW", about: "One row per production order." },
  { kind: "material", label: "Material", perm: "MATERIAL_REPORT_VIEW", about: "Material requirement per order (PCS; CORD in MTR)." },
  { kind: "purchase", label: "Purchase", perm: "PURCHASE_REPORT_VIEW", about: "All orders combined, in purchase units." },
];

// Report rows are flat; columns come from the first row's keys.
function columnsFor(rows: ReportRowDTO[]): Column<ReportRowDTO>[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((key) => {
    const numeric = rows.every((r) => typeof r[key] === "number" || r[key] === "");
    return {
      key,
      header: key,
      align: numeric ? "right" : "left",
      render: (r) => (typeof r[key] === "number" ? formatNumber(r[key], 2) : r[key] || (numeric ? "·" : "")),
    };
  });
}

function ReportTable({ kind }: { kind: ReportKind }) {
  const report = useReport(kind);
  return (
    <QueryState isPending={report.isPending} error={report.error}>
      {() => (
        <DataGrid columns={columnsFor(report.data!)} rows={report.data!} rowKey={(r) => String(Object.values(r)[0])} maxHeight="calc(100vh - 300px)" />
      )}
    </QueryState>
  );
}

export function ReportsPage() {
  const { can } = useAuth();
  const tabs = TABS.filter((t) => can(t.perm));
  const [active, setActive] = useState<ReportKind | undefined>(tabs[0]?.kind);
  const [downloadError, setDownloadError] = useState<unknown>(null);

  if (!tabs.length || !active) return <Forbidden />;
  const tab = tabs.find((t) => t.kind === active)!;

  async function download() {
    setDownloadError(null);
    try {
      await reportsApi.downloadCsv(active!);
    } catch (e) {
      setDownloadError(e);
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={tab.about}
        actions={
          <button className="btn" onClick={download}>
            ⬇ Download CSV
          </button>
        }
      />
      <ErrorAlert error={downloadError} />
      <div className="card">
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.kind}
              role="tab"
              aria-selected={t.kind === active}
              className={`tab ${t.kind === active ? "active" : ""}`}
              onClick={() => setActive(t.kind)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ReportTable key={active} kind={active} />
      </div>
    </>
  );
}
