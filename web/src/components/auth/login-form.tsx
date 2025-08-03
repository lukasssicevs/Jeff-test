"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn(email, password);

    if (result.success) {
      router.push("/dashboard/home");
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="flex flex-col items-center pb-0 pt-6 sm:pt-8 px-4 sm:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
              Welcome back
            </h1>
            <p className="text-gray-600 text-center">Sign in to your account</p>
          </CardHeader>

          <CardBody className="px-4 sm:px-8 py-4 sm:py-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <Alert color="danger" variant="flat" description={error} />
              )}

              <Input
                type="email"
                label="Email address"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isRequired
                variant="bordered"
                color="primary"
                size="lg"
                className="mb-4"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isRequired
                variant="bordered"
                color="primary"
                size="lg"
                className="mb-6"
              />

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <div className="text-center pt-4">
                <span className="text-slate-600">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
