import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowMind AI – Multilingual AI Business Operating System",
  description: "Production-ready Multilingual AI Business OS with 15 specialized agents, natural language workflows, 3D spatial visuals, and layman chatbot MVP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
