import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { SchoolLogo } from "@/components/SchoolLogo";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (user) {
      window.location.replace("/admin");
    }
  }, [user]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          window.location.replace("/admin");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setLocation("/")}
        >
          <SchoolLogo size={48} className="h-12 w-12 rounded-full bg-white p-1 shadow" />
          <span className="font-bold text-xl text-primary">Montessori Admin</span>
        </button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-3xl font-bold text-primary font-serif">Secure Portal</CardTitle>
          <CardDescription>Enter your admin credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 bg-slate-50"
              />
            </div>

            {loginMutation.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {loginMutation.error.message}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
