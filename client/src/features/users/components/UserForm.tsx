import { useState } from "react";
import type { DepartmentDTO, RoleDTO, UserDTO, UserInput } from "@pp/shared";
import { Modal } from "../../../components/Modal";
import { ErrorAlert, Field } from "../../../components/ui";
import { useSaveUser } from "../users.hooks";

interface Props {
  /** undefined = create */
  user?: UserDTO;
  isSelf: boolean;
  roles: RoleDTO[];
  departments: DepartmentDTO[];
  onClose: () => void;
}

const idOrNull = (v: string) => (v ? Number(v) : null);

export function UserForm({ user, isSelf, roles, departments, onClose }: Props) {
  const save = useSaveUser();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(String(user?.role?.id ?? ""));
  const [departmentId, setDepartmentId] = useState(String(user?.department?.id ?? ""));
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  function submit() {
    const body: UserInput = { name, departmentId: idOrNull(departmentId) };
    if (!user) Object.assign(body, { email, password });
    else if (password) body.password = password;
    // The server refuses changes to your own role or active status, so don't send them.
    if (!isSelf) Object.assign(body, { roleId: idOrNull(roleId), isActive });
    save.mutate({ id: user?.id, body }, { onSuccess: onClose });
  }

  return (
    <Modal
      open
      width={560}
      title={user ? `Edit ${user.name}` : "Add user"}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <ErrorAlert error={save.error} />
      <Field label="Full name">
        <input className="input" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Email">
        <input className="input" type="email" required disabled={!!user} value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={user ? "New password" : "Password"} hint={user ? "Leave blank to keep the current password. Setting one logs the user out." : "At least 8 characters."}>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required={!user}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <div className="form-grid">
        <Field label="Department">
          <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">— None —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Role" hint={isSelf ? "You cannot change your own role." : undefined}>
          <select className="input" value={roleId} disabled={isSelf} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">— None —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <label className="check">
        <input type="checkbox" checked={isActive} disabled={isSelf} onChange={(e) => setIsActive(e.target.checked)} />
        Active — can log in
      </label>
    </Modal>
  );
}
