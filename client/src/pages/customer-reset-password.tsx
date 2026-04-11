import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Droplets, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerResetPassword() {
  const [_, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setError("No reset token found. Please request a new password reset link.");
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to reset password.");
        return;
      }
      setSuccess(true);
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <Droplets className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Lavanderia Sunrise</h1>
          <p className="text-muted-foreground text-sm">Customer Portal</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
          {success ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Password Reset!</h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated. You can now log in with your new password.
                </p>
              </div>
              <Button
                className="w-full rounded-xl h-11"
                onClick={() => setLocation("/customer/login")}
                data-testid="button-go-to-login"
              >
                Go to Log In
              </Button>
            </div>
          ) : !token ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Invalid Link</h2>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl h-11"
                onClick={() => setLocation("/customer/login")}
                data-testid="button-request-new-link"
              >
                Request a New Link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-2">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">Set New Password</h2>
                <p className="text-sm text-muted-foreground">Enter a new password for your account.</p>
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" data-testid="text-reset-error">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground/80 ml-1">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    data-testid="input-new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all pr-11"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground/80 ml-1">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  data-testid="input-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                data-testid="button-reset-submit"
                disabled={isLoading || !password || !confirm}
                className="w-full rounded-xl h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/customer/login">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Log In
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
