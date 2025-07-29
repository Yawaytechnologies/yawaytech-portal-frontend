// src/pages/DashboardPage.jsx
import AuthGuard from "../components/common/AuthGuard";
import RoleGuard from "../components/common/RoleGuard";
import ProtectedLayout from "../components/common/ProtectedLayout";
import Dashboard from "../components/dashboard/Dashboard";

const DashboardPage = () => (
  <AuthGuard>
    <RoleGuard allowedRoles={["admin", "user"]}>
      <ProtectedLayout>
        <Dashboard />
      </ProtectedLayout>
    </RoleGuard>
  </AuthGuard>
);

export default DashboardPage;
