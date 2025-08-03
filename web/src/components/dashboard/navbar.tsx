"use client";

import { useAuth } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";

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
      return `${baseClasses} bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200`;
    }
    return `${baseClasses} text-slate-600 hover:text-slate-800 hover:bg-white/70 hover:shadow-sm`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20">
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
            <span className="text-sm text-slate-600 font-medium">
              Welcome, {user?.email}
            </span>
            <Button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
