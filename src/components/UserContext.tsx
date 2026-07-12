"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/auth";
import { WRITE_ACCESS, type Role } from "@/lib/constants";

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): SessionUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within UserProvider");
  return user;
}

// True when the current user's role may write to the given resource group.
export function useCanWrite(resource: keyof typeof WRITE_ACCESS): boolean {
  const user = useUser();
  return WRITE_ACCESS[resource].includes(user.role as Role);
}
