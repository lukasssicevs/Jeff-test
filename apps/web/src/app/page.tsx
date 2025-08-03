"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export default function Home() {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">TurboRepo App</h1>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.email}</span>
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 TurboRepo + Authentication
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Full-stack monorepo with shared auth, protected routes, and
            beautiful UI
          </p>
        </div>

        {/* Auth Status */}
        {user && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="text-green-600 text-2xl mr-3">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  You&apos;re signed in!
                </h3>
                <p className="text-green-700">
                  Access your protected dashboard and explore the features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Authentication
            </h3>
            <p className="text-gray-600">
              Shared auth methods with Supabase, protected routes, and session
              management
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Cross-Platform
            </h3>
            <p className="text-gray-600">
              Web and mobile apps sharing the same authentication logic and
              types
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Shared Packages
            </h3>
            <p className="text-gray-600">
              Common types, utilities, and API client used across all platforms
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="text-2xl mr-3">🏠</span>
                <div>
                  <div className="font-semibold text-green-800">Dashboard</div>
                  <div className="text-sm text-green-600">
                    Your protected dashboard
                  </div>
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl mr-3">🔑</span>
                  <div>
                    <div className="font-semibold text-blue-800">Sign In</div>
                    <div className="text-sm text-blue-600">
                      Access your account
                    </div>
                  </div>
                </Link>

                <Link
                  href="/signup"
                  className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-2xl mr-3">📝</span>
                  <div>
                    <div className="font-semibold text-purple-800">Sign Up</div>
                    <div className="text-sm text-purple-600">
                      Create new account
                    </div>
                  </div>
                </Link>
              </>
            )}

            <Link
              href="/test-supabase"
              className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-2xl mr-3">🔗</span>
              <div>
                <div className="font-semibold text-orange-800">
                  Test Supabase
                </div>
                <div className="text-sm text-orange-600">Verify connection</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Authentication System Ready!
          </div>
        </div>
      </div>
    </div>
  );
}
