"use client";

import ProtectedRoute from "../../components/auth/protected-route";
import DashboardNavbar from "../../components/dashboard/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <DashboardNavbar />
        <main className="pt-4">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
