import { useState, useEffect } from "react";
import { type PublicCustomer } from "@shared/schema";

export function useCustomerAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("customer_auth") === "true";
  });
  const [customer, setCustomerState] = useState<PublicCustomer | null>(() => {
    const raw = localStorage.getItem("customer_data");
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customer/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not authenticated");
      })
      .then((data: PublicCustomer) => {
        setIsAuthenticated(true);
        setCustomerState(data);
        localStorage.setItem("customer_auth", "true");
        localStorage.setItem("customer_data", JSON.stringify(data));
      })
      .catch(() => {
        setIsAuthenticated(false);
        setCustomerState(null);
        localStorage.removeItem("customer_auth");
        localStorage.removeItem("customer_data");
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(localStorage.getItem("customer_auth") === "true");
      const raw = localStorage.getItem("customer_data");
      setCustomerState(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const loginCustomer = (data: PublicCustomer) => {
    localStorage.setItem("customer_auth", "true");
    localStorage.setItem("customer_data", JSON.stringify(data));
    setIsAuthenticated(true);
    setCustomerState(data);
    window.dispatchEvent(new Event("storage"));
  };

  const logoutCustomer = async () => {
    try {
      await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("customer_auth");
    localStorage.removeItem("customer_data");
    setIsAuthenticated(false);
    setCustomerState(null);
    window.dispatchEvent(new Event("storage"));
  };

  return { isAuthenticated, customer, isLoading, loginCustomer, logoutCustomer };
}
