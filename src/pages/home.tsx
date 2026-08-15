import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b border-border flex items-center justify-between px-6 lg:px-12">
        <h1 className="text-xl font-bold text-primary tracking-tight">Meridian University</h1>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Student Login</Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="outline">Admin Login</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Academic Excellence, <br/> Organized.
          </h2>
          <p className="text-lg text-muted-foreground">
            The central portal for course registration, schedule management, and academic planning at Meridian University.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="px-8">Access Student Portal</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">Create Account</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
