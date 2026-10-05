import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AuthProvider } from "@/components/auth/AuthProvider";

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
      <body className="bg-bloom-bg dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden transition-colors duration-300">
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
