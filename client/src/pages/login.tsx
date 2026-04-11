import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Droplets, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid name or PIN. Please try again.");
        return;
      }
      login(data.id, data.name, data.role);
      setLocation("/dashboard");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Droplets className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight mb-2">Lavanderia Sunrise</h1>
          <p className="text-muted-foreground">Staff Portal Authentication</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5 sleek-shadow">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground/80 ml-1">Name</Label>
              <Input
                id="name"
                data-testid="input-name"
                type="text"
                placeholder="Enter your name"
                className="rounded-xl h-12 bg-background/50 border-border/50 focus:bg-background transition-all"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-foreground/80 ml-1">PIN</Label>
              <Input
                id="pin"
                data-testid="input-pin"
                type="password"
                placeholder="Enter your 4-digit PIN"
                className="rounded-xl h-12 bg-background/50 border-border/50 focus:bg-background transition-all text-center text-xl tracking-widest"
                value={pin}
                maxLength={4}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                autoComplete="off"
              />
            </div>

            {error && <p className="text-sm text-destructive ml-1">{error}</p>}

            <Button
              type="submit"
              data-testid="button-login"
              disabled={isLoading || pin.length < 4 || !name.trim()}
              className="w-full rounded-xl h-12 text-md shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Access Portal
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8">
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
