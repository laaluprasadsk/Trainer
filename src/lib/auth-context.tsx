"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
export interface AuthUser {
  avatarUrl?: string | null;
  id?: string;
  name: string;
  phone: string;
  email: string;
  role: "CLIENT" | "TRAINER" | "ADMIN";
}
const Context = createContext<
  | {
      user: AuthUser | null;
      isLoading: boolean;
      login: (u: AuthUser) => void;
      logout: () => void;
    }
  | undefined
>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  const refreshIdentity = useCallback(
    () =>
      fetch("/api/auth/me")
        .then((response) => response.json())
        .then((data) => setUser(data.user || null))
        .catch(() => setUser(null)),
    [],
  );
  useEffect(() => {
    refreshIdentity().finally(() => setLoading(false));
    const sync = (event: StorageEvent) => {
      if (event.key !== "trainrr-auth-event") return;
      refreshIdentity().then(() => router.refresh());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [refreshIdentity, router]);
  return (
    <Context.Provider
      value={{
        user,
        isLoading,
        login: (nextUser) => {
          setUser(nextUser);
          localStorage.setItem("trainrr-auth-event", String(Date.now()));
        },
        logout: async () => {
          const r = await fetch("/api/auth/logout", { method: "POST" });
          if (r.ok) {
            setUser(null);
            localStorage.setItem("trainrr-auth-event", String(Date.now()));
            router.push("/login");
            router.refresh();
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error("AuthProvider is required");
  return c;
}
