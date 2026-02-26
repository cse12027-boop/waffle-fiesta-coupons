import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if user has admin role
      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .limit(1);

      if (roleError || !roles?.some((r) => r.role === "admin")) {
        await supabase.auth.signOut();
        throw new Error("You don't have admin access");
      }

      navigate("/admin/dashboard");
    } catch (err: unknown) {
      toast({ title: "Login Failed", description: err instanceof Error ? err.message : "An unknown error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 gradient-waffle rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Waffle Fiesta Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl border p-6 space-y-4 shadow-lg">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-waffle text-primary-foreground">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
