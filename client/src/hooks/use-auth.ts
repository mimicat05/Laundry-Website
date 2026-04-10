import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("staff_auth") === "true";
  });

  const [staffName, setStaffName] = useState<string>(() => {
    return localStorage.getItem("staff_name") || "";
  });

  const [staffId, setStaffId] = useState<number | null>(() => {
    const id = localStorage.getItem("staff_id");
    return id ? Number(id) : null;
  });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("not authenticated");
      })
      .then((data: { id: number; name: string }) => {
        setIsAuthenticated(true);
        setStaffId(data.id);
        setStaffName(data.name);
        localStorage.setItem("staff_auth", "true");
        localStorage.setItem("staff_id", String(data.id));
        localStorage.setItem("staff_name", data.name);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setStaffId(null);
        setStaffName("");
        localStorage.removeItem("staff_auth");
        localStorage.removeItem("staff_id");
        localStorage.removeItem("staff_name");
      });
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem("staff_auth") === "true");
      setStaffName(localStorage.getItem("staff_name") || "");
      const id = localStorage.getItem("staff_id");
      setStaffId(id ? Number(id) : null);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (id: number, name: string) => {
    localStorage.setItem("staff_auth", "true");
    localStorage.setItem("staff_id", String(id));
    localStorage.setItem("staff_name", name);
    setIsAuthenticated(true);
    setStaffId(id);
    setStaffName(name);
    window.dispatchEvent(new Event("storage"));
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
    }
    localStorage.removeItem("staff_auth");
    localStorage.removeItem("staff_id");
    localStorage.removeItem("staff_name");
    setIsAuthenticated(false);
    setStaffId(null);
    setStaffName("");
    window.dispatchEvent(new Event("storage"));
  };

  return { isAuthenticated, staffId, staffName, login, logout };
}
