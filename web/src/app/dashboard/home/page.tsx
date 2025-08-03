"use client";

import { useAuth } from "../../../lib/auth-context";
import Link from "next/link";

export default function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Welcome Back!
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Authentication Working
                </h3>
                <p className="text-sm text-gray-600">
                  Using shared auth methods
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">ℹ</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Account Created
                </h3>
                <p className="text-sm text-gray-600">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dashboard Overview
          </h2>
        </div>
        <div className="p-6">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              🎉 Congratulations! You&apos;ve successfully logged in to your
              protected dashboard.
            </p>
            <p className="text-gray-600 mb-4">
              This dashboard is protected by authentication and uses the shared
              auth methods from the{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">shared</code>{" "}
              package.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Features Implemented:
              </h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>
                  ✅ Shared authentication methods from <code>shared</code>
                </li>
                <li>✅ Login and signup forms with validation</li>
                <li>
                  ✅ Protected routes that redirect to login if not
                  authenticated
                </li>
                <li>✅ User session management</li>
                <li>✅ Beautiful UI with Tailwind CSS</li>
                <li>✅ Integration with Supabase backend</li>
                <li>✅ Expense tracking with real-time updates</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/expenses"
                className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors block"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <h3 className="text-lg font-semibold">Manage Expenses</h3>
                    <p className="text-blue-100">
                      Track and manage your expenses
                    </p>
                  </div>
                </div>
              </Link>

              <div className="bg-gray-200 text-gray-700 p-6 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <h3 className="text-lg font-semibold">Analytics</h3>
                    <p className="text-gray-600">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
