import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    login.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setLocation("/admin/dashboard");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-1 pb-6 text-center">
          <div className="mx-auto w-12 h-12 bg-sidebar-primary text-sidebar-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4">A</div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Console</CardTitle>
          <CardDescription>Meridian University Administration</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin ID</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {login.error && (
                <div className="text-sm font-medium text-destructive">
                  Invalid credentials
                </div>
              )}
              <Button type="submit" className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" disabled={login.isPending}>
                {login.isPending ? "Authenticating..." : "Access Console"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Link href="/" className="text-muted-foreground hover:underline">
              Return to public portal
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
