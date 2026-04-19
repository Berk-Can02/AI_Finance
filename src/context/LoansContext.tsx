import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export type LoanType = "lent" | "borrowed";
export type LoanStatus = "open" | "settled";

export interface Loan {
  id: string;
  userId: number;
  type: LoanType;
  amount: number;
  person: string;
  date: string;        // ISO timestamp
  description?: string;
  status: LoanStatus;
  settled_at?: string;
  created_at: string;
  updated_at: string;
}

interface LoansContextValue {
  loans: Loan[];
  isLoading: boolean;
  addLoan: (loan: Omit<Loan, "id" | "userId" | "created_at" | "updated_at" | "status" | "settled_at">) => Promise<void>;
  updateLoan: (id: string, patch: Partial<Loan>) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  toggleSettled: (id: string) => Promise<void>;
  refreshLoans: () => Promise<void>;
}

const LoansContext = createContext<LoansContextValue | null>(null);

export function LoansProvider({ children }: { children: ReactNode }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Fetch all loans from backend
  const refreshLoans = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/loans`, { headers: headers() });
      if (!res.ok) throw new Error("Failed to fetch loans");
      const data: Loan[] = await res.json();
      setLoans(data);
    } catch (err) {
      console.error("refreshLoans error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token, headers]);

  // Load on mount / when token changes
  useEffect(() => {
    refreshLoans();
  }, [refreshLoans]);

  const addLoan = useCallback(async (loan: Omit<Loan, "id" | "userId" | "created_at" | "updated_at" | "status" | "settled_at">) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/loans`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(loan),
      });
      if (!res.ok) throw new Error("Failed to create loan");
      const created: Loan = await res.json();
      setLoans((prev) => [created, ...prev]);
    } catch (err) {
      console.error("addLoan error:", err);
      throw err;
    }
  }, [token, headers]);

  const updateLoan = useCallback(async (id: string, patch: Partial<Loan>) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/loans/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update loan");
      const updated: Loan = await res.json();
      setLoans((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      console.error("updateLoan error:", err);
      throw err;
    }
  }, [token, headers]);

  const deleteLoan = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/loans/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Failed to delete loan");
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("deleteLoan error:", err);
      throw err;
    }
  }, [token, headers]);

  const toggleSettled = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/loans/${id}/toggle`, {
        method: "PATCH",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Failed to toggle loan status");
      const updated: Loan = await res.json();
      setLoans((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      console.error("toggleSettled error:", err);
      throw err;
    }
  }, [token, headers]);

  return (
    <LoansContext.Provider value={{ loans, isLoading, addLoan, updateLoan, deleteLoan, toggleSettled, refreshLoans }}>
      {children}
    </LoansContext.Provider>
  );
}

export function useLoans() {
  const ctx = useContext(LoansContext);
  if (!ctx) throw new Error("useLoans must be used within LoansProvider");
  return ctx;
}