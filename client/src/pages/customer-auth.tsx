import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Droplets, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type PublicCustomer } from "@shared/schema";

type Tab = "login" | "signup" | "forgot";

export function CustomerAuth() {
  const [_, setLocation] = useLocation();
  const { loginCustomer, isAuthenticated, isLoading: authLoading } = useCustomerAuth();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/customer/dashboard");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupContact, setSignupContact] = useState("");
  const [signupAddress, setSignupAddress] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }
      loginCustomer(data as PublicCustomer);
      setLocation("/customer/dashboard");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Request failed.");
        return;
      }
      setForgotSent(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
          contactNumber: signupContact.trim(),
          address: signupAddress.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        return;
      }
      loginCustomer(data as PublicCustomer);
      setLocation("/customer/dashboard");
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <Droplets className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Lavanderia Sunrise</h1>
          <p className="text-muted-foreground text-sm">Customer Portal</p>
        </div>

        {/* Tab Switcher — hide on forgot tab */}
        {tab !== "forgot" && (
          <div className="flex bg-muted/60 rounded-2xl p-1 mb-6">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                tab === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-login"
            >
              Log In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                tab === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-signup"
            >
              Create Account
            </button>
          </div>
        )}

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive" data-testid="text-auth-error">
              {error}
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-foreground/80 ml-1">Gmail Address</Label>
                <Input
                  id="login-email"
                  data-testid="input-login-email"
                  type="email"
                  placeholder="you@gmail.com"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-foreground/80 ml-1">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    data-testid="input-login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all pr-11"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
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
              <Button
                type="submit"
                data-testid="button-login-submit"
                disabled={isLoading || !loginEmail || !loginPassword}
                className="w-full rounded-xl h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Log In
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setTab("signup"); setError(""); }} className="text-primary hover:underline font-medium">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-foreground/80 ml-1">Full Name</Label>
                <Input
                  id="signup-name"
                  data-testid="input-signup-name"
                  placeholder="Juan dela Cruz"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={signupName}
                  onChange={(e) => { setSignupName(e.target.value); setError(""); }}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground/80 ml-1">Gmail Address</Label>
                <Input
                  id="signup-email"
                  data-testid="input-signup-email"
                  type="email"
                  placeholder="you@gmail.com"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground/80 ml-1">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    data-testid="input-signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all pr-11"
                    value={signupPassword}
                    onChange={(e) => { setSignupPassword(e.target.value); setError(""); }}
                    autoComplete="new-password"
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
                <Label htmlFor="signup-contact" className="text-foreground/80 ml-1">Contact Number</Label>
                <Input
                  id="signup-contact"
                  data-testid="input-signup-contact"
                  placeholder="09XXXXXXXXX"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={signupContact}
                  onChange={(e) => { setSignupContact(e.target.value); setError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-address" className="text-foreground/80 ml-1">Address</Label>
                <Input
                  id="signup-address"
                  data-testid="input-signup-address"
                  placeholder="Barangay, City, Province"
                  className="rounded-xl h-11 bg-background/50 border-border/50 focus:bg-background transition-all"
                  value={signupAddress}
                  onChange={(e) => { setSignupAddress(e.target.value); setError(""); }}
                  autoComplete="street-address"
                />
              </div>
              <Button
                type="submit"
                data-testid="button-signup-submit"
                disabled={isLoading || !signupName || !signupEmail || !signupPassword || !signupContact || !signupAddress}
                className="w-full rounded-xl h-11 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all mt-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Account
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-primary hover:underline font-medium">
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
