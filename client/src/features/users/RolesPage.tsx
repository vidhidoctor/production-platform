import { useState, type FormEvent } from "react";
import { PERMISSIONS, type PermissionCode, type RoleDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useCreateRole, useRoles, useSetRolePermissions } from "./users.hooks";

const CODES = Object.keys(PERMISSIONS) as PermissionCode[];

// Group rows by area: PUNCHING_VIEW -> "Punching"
const GROUPS: [string, PermissionCode[]][] = [
  ["Punching", CODES.filter((c) => c.startsWith("PUNCHING_"))],
  ["Production", CODES.filter((c) => c.startsWith("PRODUCTION_") && !c.includes("REPORT"))],
  ["Material & purchase", CODES.filter((c) => c.startsWith("MATERIAL_") || c.startsWith("PURCHASE_REQ"))],
  ["Reports", CODES.filter((c) => c.endsWith("_REPORT_VIEW"))],
  ["Users & access", CODES.filter((c) => c.startsWith("USER_") || (c.endsWith("_MANAGE") && !c.startsWith("MATERIAL_")))],
];

export function RolesPage() {
  const { can, user } = useAuth();
  const roles = useRoles();
  const setPerms = useSetRolePermissions();
  const createRole = useCreateRole();
  const editable = can("PERMISSION_MANAGE");
  // Unsaved edits per role id
  const [draft, setDraft] = useState<Record<number, PermissionCode[]>>({});
  const [newRole, setNewRole] = useState("");

  const current = (r: RoleDTO) => draft[r.id] ?? r.permissions;
  const dirty = (r: RoleDTO) => !!draft[r.id] && [...draft[r.id]].sort().join() !== [...r.permissions].sort().join();

  function toggle(r: RoleDTO, code: PermissionCode) {
    const perms = current(r);
    setDraft({ ...draft, [r.id]: perms.includes(code) ? perms.filter((p) => p !== code) : [...perms, code] });
  }

  function save(r: RoleDTO) {
    setPerms.mutate(
      { id: r.id, permissions: current(r) },
      {
        onSuccess: () =>
          setDraft(({ [r.id]: _, ...rest }) => rest),
      },
    );
  }

  function addRole(e: FormEvent) {
    e.preventDefault();
    createRole.mutate(newRole, { onSuccess: () => setNewRole("") });
  }

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        subtitle="Access is checked by permission. A role is a named set of permissions."
        actions={
          can("ROLE_MANAGE") && (
            <form className="row" onSubmit={addRole}>
              <input className="input" style={{ width: 200 }} placeholder="New role name" required value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              <button className="btn" disabled={createRole.isPending}>
                + Add role
              </button>
            </form>
          )
        }
      />
      <ErrorAlert error={setPerms.error ?? createRole.error} />
      <QueryState isPending={roles.isPending} error={roles.error}>
        {() => (
          <div className="card">
            <div className="table-wrap" style={{ maxHeight: "calc(100vh - 240px)" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th className="sticky-col">Permission</th>
                    {roles.data!.map((r) => (
                      <th key={r.id} style={{ textAlign: "center" }}>
                        {r.name}
                        <br />
                        <span className="muted" style={{ fontWeight: 400 }}>
                          {r.users} user(s){r.name === user?.role ? " · yours" : ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GROUPS.map(([group, codes]) => [
                    <tr key={group}>
                      <td colSpan={roles.data!.length + 1} style={{ background: "var(--surface-2)", fontWeight: 600 }}>
                        {group}
                      </td>
                    </tr>,
                    ...codes.map((code) => (
                      <tr key={code}>
                        <td className="sticky-col">
                          <code>{code}</code>
                          <br />
                          <small className="muted">{PERMISSIONS[code]}</small>
                        </td>
                        {roles.data!.map((r) => (
                          <td key={r.id} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              aria-label={`${r.name}: ${code}`}
                              checked={current(r).includes(code)}
                              disabled={!editable}
                              onChange={() => toggle(r, code)}
                            />
                          </td>
                        ))}
                      </tr>
                    )),
                  ])}
                </tbody>
                {editable && (
                  <tfoot>
                    <tr>
                      <td className="sticky-col" />
                      {roles.data!.map((r) => (
                        <td key={r.id} style={{ textAlign: "center" }}>
                          <button className="btn btn-sm btn-primary" disabled={!dirty(r) || setPerms.isPending} onClick={() => save(r)}>
                            Save
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}
