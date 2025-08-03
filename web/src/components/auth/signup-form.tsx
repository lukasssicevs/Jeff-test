"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Alert } from "@heroui/alert";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, confirmPassword);

    if (result.success) {
      if (result.needsVerification) {
        setNeedsVerification(true);
        setError(""); // Clear any previous errors
      } else {
        router.push("/dashboard/home");
      }
    } else {
      setError(result.error || "Sign up failed");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="flex flex-col items-center pb-0 pt-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create account
            </h1>
            <p className="text-gray-600">Sign up for a new account</p>
          </CardHeader>

          <CardBody className="px-8 py-6">
            {error && !needsVerification && (
              <Alert
                color="danger"
                variant="flat"
                description={error}
                className="mb-6"
              />
            )}

            {needsVerification && (
              <Alert
                color="success"
                variant="flat"
                title="Account created successfully!"
                description={
                  <div className="mt-2">
                    <p className="text-sm">
                      Please check your email <strong>{email}</strong> and click
                      the verification link to complete your account setup.
                    </p>
                  </div>
                }
                className="mb-6"
              />
            )}

            {!needsVerification ? (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  description="Password must be at least 8 characters long"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isRequired
                  variant="bordered"
                  color="primary"
                  size="lg"
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                  isLoading={isLoading}
                  isDisabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign up"}
                </Button>

                <div className="text-center pt-4">
                  <span className="text-slate-600">
                    Already have an account?{" "}
                  </span>
                  <Link
                    href="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  as={Link}
                  href="/login"
                  color="primary"
                  variant="bordered"
                  size="lg"
                  className="w-full font-semibold"
                >
                  Go to Sign In
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Didn&apos;t receive an email? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={() => setNeedsVerification(false)}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    try again
                  </button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
