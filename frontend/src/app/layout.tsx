import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "ClaimLens",
  description: "AI-powered OCR for OpenIMIS claim documents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
