"use client";

import { useAuth } from "../../lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/button";
import { useState } from "react";

export default function DashboardNavbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        {/* Desktop Navigation */}
        <div className="flex justify-between h-16">
          {/* Desktop Nav */}
          <div className="flex items-center space-x-8">
            <nav className="hidden md:flex space-x-2">
              <Link
                href="/dashboard/home"
                className={getLinkClassName("/dashboard/home")}
              >
                🏠 <span className="hidden lg:inline">Home</span>
              </Link>
              <Link
                href="/dashboard/expenses"
                className={getLinkClassName("/dashboard/expenses")}
              >
                💰 <span className="hidden lg:inline">Expenses</span>
              </Link>
            </nav>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-slate-600 font-medium hidden lg:block">
              Welcome, {user?.email?.split("@")[0]}
            </span>
            <Button
              onClick={handleSignOut}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md"
              size="sm"
            >
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">🚪</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-transparent text-slate-700 hover:bg-slate-100"
              size="sm"
              isIconOnly
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard/home"
                className={`${getLinkClassName("/dashboard/home")} block w-full`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                href="/dashboard/expenses"
                className={`${getLinkClassName("/dashboard/expenses")} block w-full`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                💰 Expenses
              </Link>
              <div className="pt-4 border-t border-slate-200 mt-4">
                <div className="px-4 py-2">
                  <p className="text-sm text-slate-600">{user?.email}</p>
                </div>
                <Button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md w-full"
                  size="sm"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
