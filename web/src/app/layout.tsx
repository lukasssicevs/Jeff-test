import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "../components/providers/client-providers";

export const metadata: Metadata = {
  title: "JEFF-TEST",
  description: "Full-stack monorepo with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
