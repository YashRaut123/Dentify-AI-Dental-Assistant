"use client";

import { useUser } from "@clerk/nextjs";
import type { ReactNode } from "react";

type AuthVisibilityProps = {
  children: ReactNode;
};

export function SignedInView({ children }: AuthVisibilityProps) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return <>{children}</>;
}

export function SignedOutView({ children }: AuthVisibilityProps) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return <>{children}</>;
}