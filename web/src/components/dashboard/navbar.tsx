"use client";

import { useAuth } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardNavbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActiveRoute = (route: string) => {
    if (route === "/dashboard/home") {
      return pathname === "/dashboard" || pathname === "/dashboard/home";
    }
    return pathname === route;
  };

  const getLinkClassName = (route: string) => {
    const baseClasses =
      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
    if (isActiveRoute(route)) {
      return `${baseClasses} bg-blue-100 text-blue-700 shadow-sm border border-blue-200`;
    }
    return `${baseClasses} text-slate-600 hover:text-slate-900 hover:bg-white/60 hover:shadow-sm`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-50 to-blue-50 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <nav className="flex space-x-2">
              <Link
                href="/dashboard/home"
                className={getLinkClassName("/dashboard/home")}
              >
                🏠 Home
              </Link>
              <Link
                href="/dashboard/expenses"
                className={getLinkClassName("/dashboard/expenses")}
              >
                💰 Expenses
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-700 font-medium">
              Welcome, {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
