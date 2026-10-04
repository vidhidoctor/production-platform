// Every page route names the permission it needs — the same one the API checks.
import { createBrowserRouter, Link } from "react-router";
import type { PermissionCode } from "@pp/shared";
import type { ReactNode } from "react";
import { RequireAuth, RequirePermission } from "../lib/auth";
import { AppLayout, HomeRedirect } from "./layout/AppLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { PunchingPage } from "../features/punching/PunchingPage";
import { PunchingDesignPage } from "../features/punching/PunchingDesignPage";
import { ProductionPage } from "../features/production/ProductionPage";
import { DesignSearchPage } from "../features/production/DesignSearchPage";
import { DesignPage } from "../features/production/DesignPage";
import { OrderEditorPage } from "../features/production/OrderEditorPage";
import { OrderDetailPage } from "../features/production/OrderDetailPage";
import { MaterialMasterPage } from "../features/materials/MaterialMasterPage";
import { MaterialRequirementsPage } from "../features/reports/MaterialRequirementsPage";
import { PurchaseRequirementsPage } from "../features/reports/PurchaseRequirementsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { UsersPage } from "../features/users/UsersPage";
import { RolesPage } from "../features/users/RolesPage";
import { DepartmentsPage } from "../features/users/DepartmentsPage";

const guarded = (perm: PermissionCode | PermissionCode[], page: ReactNode) => (
  <RequirePermission perm={perm}>{page}</RequirePermission>
);

function NotFound() {
  return (
    <div className="card">
      <div className="card-body">
        <h2>Page not found</h2>
        <Link to="/">Go to start page</Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },

          { path: "punching", element: guarded("PUNCHING_VIEW", <PunchingPage />) },
          { path: "punching/designs/:designNo", element: guarded("PUNCHING_VIEW", <PunchingDesignPage />) },

          { path: "production", element: guarded("PRODUCTION_VIEW", <DesignSearchPage />) },
          { path: "production/designs/:designNo", element: guarded("PRODUCTION_VIEW", <DesignPage />) },
          { path: "production/orders", element: guarded("PRODUCTION_VIEW", <ProductionPage />) },
          { path: "production/orders/:id", element: guarded("PRODUCTION_VIEW", <OrderDetailPage />) },
          { path: "production/orders/:id/edit", element: guarded(["PRODUCTION_UPDATE", "PRODUCTION_VIEW"], <OrderEditorPage />) },

          { path: "materials/requirements", element: guarded("MATERIAL_REQUIREMENT_VIEW", <MaterialRequirementsPage />) },
          { path: "materials/purchase", element: guarded("PURCHASE_REQUIREMENT_VIEW", <PurchaseRequirementsPage />) },
          { path: "materials/master", element: guarded("MATERIAL_MASTER_VIEW", <MaterialMasterPage />) },

          // Checks each report tab's permission itself.
          { path: "reports", element: <ReportsPage /> },

          { path: "admin/users", element: guarded("USER_VIEW", <UsersPage />) },
          { path: "admin/roles", element: guarded("USER_VIEW", <RolesPage />) },
          { path: "admin/departments", element: guarded("USER_VIEW", <DepartmentsPage />) },

          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
