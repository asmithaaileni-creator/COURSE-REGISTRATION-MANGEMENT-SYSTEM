import { Route, Redirect, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path?: string;
  component?: React.ComponentType<any>;
  children?: ReactNode;
  allowedRoles?: ("student" | "admin")[];
}

export function ProtectedRoute({ path, component: Component, children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // If accessing an admin route, redirect to admin login
    if (location.startsWith("/admin")) {
      return <Redirect to="/admin/login" />;
    }
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have the right role
    if (user.role === "admin") {
      return <Redirect to="/admin/dashboard" />;
    }
    return <Redirect to="/dashboard" />;
  }

  if (path) {
    return (
      <Route path={path}>
        {(params) => (Component ? <Component params={params} /> : children)}
      </Route>
    );
  }

  return <>{Component ? <Component /> : children}</>;
}
