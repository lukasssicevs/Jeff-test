"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    redirect("/dashboard/home");
  }, []);

  return null;
}
