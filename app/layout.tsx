import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planner – Personal Finance Tracker",
  description: "Track your income, expenses, and budgets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">
        <Navigation />
        <main className="flex-1 bg-slate-50 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
