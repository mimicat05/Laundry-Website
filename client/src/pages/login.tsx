import { useState } from "react";
import { useLocation } from "wouter";
import { Droplets, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const [_, setLocation] = useLocation();
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock logic for presentation
    if (pin === "1234" || pin.length > 0) {
      login();
      setLocation("/");
    } else {
      setError("Please enter a valid staff PIN.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
            <Droplets className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight mb-2">Lumiere</h1>
          <p className="text-muted-foreground">Staff Portal Authentication</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5 sleek-shadow">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-foreground/80 ml-1">Staff PIN</Label>
              <Input 
                id="pin" 
                type="password" 
                placeholder="Enter your PIN (e.g. 1234)" 
                className="rounded-xl h-12 bg-background/50 border-border/50 focus:bg-background transition-all text-center text-xl tracking-widest"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
              />
              {error && <p className="text-sm text-destructive ml-1">{error}</p>}
            </div>
            <Button type="submit" className="w-full rounded-xl h-12 text-md shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Access Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-sm text-muted-foreground">
          For demo purposes, enter any PIN to continue.
        </p>
      </div>
    </div>
  );
}
