import { createContext, useContext, ReactNode } from "react";
import { useGetMe, AuthUser } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe({
    query: {
      retry: (count, error: any) => {
        // Don't retry on 401 (unauthenticated) or 403
        if (error?.status === 401 || error?.status === 403) return false;
        return count < 2;
      },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // isError means unauthenticated — treat as no user
  return (
    <AuthContext.Provider value={{ user: isError ? null : (user || null), isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
