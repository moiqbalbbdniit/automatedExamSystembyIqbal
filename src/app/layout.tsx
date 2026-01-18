import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner"; 
import { AuthProvider } from "@/lib/hooks/useAuth";
import GlobalLoader from "@/components/GlobalLoader";

export const metadata: Metadata = {
  title: "AI Exam System",
  description: "Automated Question Paper & Evaluation System of Invertis University Login to continue your examination.",
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <GlobalLoader />
          <Toaster position="top-right" richColors />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
