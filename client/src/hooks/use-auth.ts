import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("staff_auth") === "true";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("staff_auth") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = () => {
    localStorage.setItem("staff_auth", "true");
    setIsAuthenticated(true);
    // Dispatch event to update other tabs/hooks
    window.dispatchEvent(new Event("storage"));
  };

  const logout = () => {
    localStorage.removeItem("staff_auth");
    setIsAuthenticated(false);
    window.dispatchEvent(new Event("storage"));
  };

  return { isAuthenticated, login, logout };
}
