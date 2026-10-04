import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionCode, UserInput } from "@pp/shared";
import { usersApi } from "./users.api";

export const useUsers = () => useQuery({ queryKey: ["admin", "users"], queryFn: usersApi.list });
export const useRoles = () => useQuery({ queryKey: ["admin", "roles"], queryFn: usersApi.roles });
export const useDepartments = () => useQuery({ queryKey: ["admin", "departments"], queryFn: usersApi.departments });

// Every admin change can affect user lists, role counts and the logged-in user's own permissions.
function useAdminMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export const useSaveUser = () =>
  useAdminMutation(({ id, body }: { id?: number; body: UserInput }) => (id ? usersApi.update(id, body) : usersApi.create(body)));

export const useDeleteUser = () => useAdminMutation((id: number) => usersApi.remove(id));

export const useCreateRole = () => useAdminMutation((name: string) => usersApi.createRole(name));

export const useSetRolePermissions = () =>
  useAdminMutation(({ id, permissions }: { id: number; permissions: PermissionCode[] }) => usersApi.setRolePermissions(id, permissions));

export const useCreateDepartment = () => useAdminMutation((name: string) => usersApi.createDepartment(name));
