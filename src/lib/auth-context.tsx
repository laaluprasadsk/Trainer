"use client";
import {
  createContext,
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
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        isLoading,
        login: setUser,
        logout: async () => {
          const r = await fetch("/api/auth/logout", { method: "POST" });
          if (r.ok) {
            setUser(null);
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
