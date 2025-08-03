"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "../../lib/supabase";

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await apiClient.healthCheck();
        if (result) {
          setStatus("connected");
        } else {
          setStatus("error");
          setError("Health check failed");
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Connection failed");
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Supabase Connection Test
            </h1>
            <p className="text-gray-600">Testing your database connection</p>
          </div>

          <div className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-center">
              {status === "checking" && (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-lg text-gray-600">
                    Checking connection...
                  </span>
                </div>
              )}

              {status === "connected" && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-lg text-green-600 font-semibold">
                    Connected successfully!
                  </span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-lg text-red-600 font-semibold">
                    Connection failed
                  </span>
                </div>
              )}
            </div>

            {/* Error Details */}
            {status === "error" && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">
                  Error Details:
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Supabase Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Configuration:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono text-gray-900">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Anon Key:</span>
                  <span className="font-mono text-gray-900">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(
                      0,
                      20
                    )}
                    ...
                  </span>
                </div>
              </div>
            </div>

            {/* Status Summary */}
            {status === "connected" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-semibold mb-2">
                  ✅ Ready to go!
                </h3>
                <p className="text-green-700 text-sm">
                  Your Supabase connection is working. You can now use
                  authentication, database queries, and other Supabase features.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back to Home
            </Link>

            {status === "connected" && (
              <Link
                href="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Authentication
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
