import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "../components/providers/client-providers";
import { Providers } from "./providers";

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
    <html lang="en" className="light">
      <body>
        <Providers>
          <ClientProviders>{children}</ClientProviders>
        </Providers>
      </body>
    </html>
  );
}
