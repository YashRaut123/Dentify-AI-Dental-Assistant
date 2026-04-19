"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { CalendarIcon, CrownIcon, HomeIcon, MicIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-2 border-b border-border/50 bg-background/80 backdrop-blur-md h-16 overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-full min-w-0 gap-2 sm:gap-4">
        {/* LOGO */}
        <div className="flex items-center min-w-0 gap-2 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="DentWise Logo" width={32} height={32} className="w-9 sm:w-11" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1 sm:gap-2 text-sm md:text-base transition-colors ${
                pathname === "/dashboard"
                  ? "text-foreground hover:text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <Link
              href="/appointments"
              className={`flex items-center gap-1 sm:gap-2 text-sm md:text-base transition-colors hover:text-foreground ${
                pathname === "/appointments" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden md:inline">Appointments</span>
            </Link>

            <Link
              href="/voice"
              className={`flex items-center gap-1 sm:gap-2 text-sm md:text-base transition-colors hover:text-foreground ${
                pathname === "/voice" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <MicIcon className="w-4 h-4" />
              <span className="hidden md:inline">Voice</span>
            </Link>
            <Link
              href="/pro"
              className={`flex items-center gap-1 sm:gap-2 text-sm md:text-base transition-colors hover:text-foreground ${
                pathname === "/pro" ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <CrownIcon className="w-4 h-4" />
              <span className="hidden md:inline">Pro</span>
            </Link>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
            </div>

            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;