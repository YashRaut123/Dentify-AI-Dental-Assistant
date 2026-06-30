import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import UserSync from "@/components/ui/UserSync";
import TanStackProvider from "@/components/ui/providers/TanstackProvider";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dentify - AI Voice Dental Assistant",
  description: "Dentify is an AI-powered voice dental assistant designed to provide personalized oral health advice, appointment scheduling, and real-time support for dental care. With Dentify, users can easily manage their dental health through natural language interactions, making it a convenient and accessible tool for maintaining a healthy smile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TanStackProvider>
    <ClerkProvider
    afterSignOutUrl="/"
    appearance={{
          variables: {
            colorPrimary: "#e78a53",
            colorBackground: "#f3f4f6",
            colorText: "#111827",
            colorTextSecondary: "#6b7280",
            colorInputBackground: "#f3f4f6",
          },
        }}>
    <html lang="en">
        <body className={`${geistSans.variable} ${mono.variable} antialiased dark`}>
        {/* Done in HOME PAGE */}
        {/* <UserSync /> */}
        <Toaster />
        {children}
      </body>
    </html>
    </ClerkProvider>
    </TanStackProvider>
  );
}
