import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "Triage Copilot — issue-triage-2x",
  description:
    "Workshop demo: a chat triage agent with the entire knowledge base crammed into one context — and the output drift that causes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      {/*
        suppressHydrationWarning: some browser extensions inject attributes
        (e.g. style="overscroll-behavior: contain") onto <body> before React
        hydrates, which trips a hydration mismatch warning. This suppresses the
        warning for <body>'s own attributes only — it does NOT hide real
        mismatches in our app's content below.
      */}
      <body
        className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
