import { useState } from "react";
import type { UserDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useDeleteUser, useDepartments, useRoles, useUsers } from "./users.hooks";
import { UserForm } from "./components/UserForm";

export function UsersPage() {
  const { can, user: me } = useAuth();
  const users = useUsers();
  const roles = useRoles();
  const departments = useDepartments();
  const del = useDeleteUser();
  const [editing, setEditing] = useState<UserDTO | "new" | null>(null);

  const pending = users.data?.filter((u) => !u.isActive) ?? [];

  function remove(u: UserDTO) {
    if (confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) del.mutate(u.id);
  }

  const columns: Column<UserDTO>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <>
          <strong>{u.name}</strong> {u.id === me?.id && <span className="badge">you</span>}
        </>
      ),
    },
    { key: "email", header: "Email", render: (u) => u.email },
    { key: "department", header: "Department", render: (u) => u.department?.name ?? <span className="muted">—</span> },
    { key: "role", header: "Role", render: (u) => u.role?.name ?? <span className="muted">— none —</span> },
    {
      key: "status",
      header: "Status",
      render: (u) =>
        u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-warning">Waiting for activation</span>,
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {can("USER_UPDATE") && (
            <button className="btn btn-sm" onClick={() => setEditing(u)}>
              {u.isActive ? "Edit" : "Review"}
            </button>
          )}
          {can("USER_DELETE") && u.id !== me?.id && (
            <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Assign each person a department and role, and activate their account."
        actions={
          can("USER_CREATE") && (
            <button className="btn btn-primary" onClick={() => setEditing("new")} disabled={!roles.data || !departments.data}>
              + Add user
            </button>
          )
        }
      />
      {pending.length > 0 && (
        <div className="alert alert-info">
          {pending.length} account(s) waiting for activation: {pending.map((u) => u.name).join(", ")}. Click <strong>Review</strong> to assign a
          department and role.
        </div>
      )}
      <ErrorAlert error={del.error} />
      <QueryState isPending={users.isPending} error={users.error}>
        {() => (
          <div className="card">
            <DataGrid columns={columns} rows={users.data!} rowKey={(u) => u.id} />
          </div>
        )}
      </QueryState>
      {editing && roles.data && departments.data && (
        <UserForm
          user={editing === "new" ? undefined : editing}
          isSelf={editing !== "new" && editing.id === me?.id}
          roles={roles.data}
          departments={departments.data}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
