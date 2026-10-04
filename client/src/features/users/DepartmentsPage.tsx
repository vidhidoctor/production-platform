import { useState, type FormEvent } from "react";
import type { DepartmentDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useCreateDepartment, useDepartments } from "./users.hooks";

const columns: Column<DepartmentDTO>[] = [
  { key: "name", header: "Department", render: (d) => <strong>{d.name}</strong> },
  { key: "users", header: "Users", align: "right", render: (d) => d._count.users },
];

export function DepartmentsPage() {
  const { can } = useAuth();
  const departments = useDepartments();
  const create = useCreateDepartment();
  const [name, setName] = useState("");

  function add(e: FormEvent) {
    e.preventDefault();
    create.mutate(name, { onSuccess: () => setName("") });
  }

  return (
    <>
      <PageHeader
        title="Departments"
        actions={
          can("DEPARTMENT_MANAGE") && (
            <form className="row" onSubmit={add}>
              <input className="input" style={{ width: 200 }} placeholder="New department" required value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn" disabled={create.isPending}>
                + Add
              </button>
            </form>
          )
        }
      />
      <ErrorAlert error={create.error} />
      <QueryState isPending={departments.isPending} error={departments.error}>
        {() => (
          <div className="card" style={{ maxWidth: 520 }}>
            <DataGrid columns={columns} rows={departments.data!} rowKey={(d) => d.id} />
          </div>
        )}
      </QueryState>
    </>
  );
}
