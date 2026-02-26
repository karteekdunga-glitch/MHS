import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("karteekdunga@gmail.com");
  const [password, setPassword] = useState("test123");
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (user) {
      setLocation("/admin");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (loginMutation.isSuccess) {
      setLocation("/admin");
    }
  }, [loginMutation.isSuccess, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl text-primary">Montessori Admin</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-3xl font-bold text-primary font-serif">Secure Portal</CardTitle>
          <CardDescription>Enter credentials to access the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
