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
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <main className="pt-4">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
