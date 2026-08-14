import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { notifyOps } from "@/lib/notify";

export type User = {
  id: string;
  name: string;
  email: string;
  guest: boolean;
  admin: boolean;
  balance: number;
};

export type Order = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  utr: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  type?: "deposit" | "withdrawal";
  destination?: string;
};


type Account = { email: string; password: string; name: string; balance: number };

type State = {
  user: User | null;
  accounts: Record<string, Account>;
  orders: Order[];
};

const KEY = "win1-vault-state";
const empty: State = { user: null, accounts: {}, orders: [] };

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as State) } : empty;
  } catch {
    return empty;
  }
}

export const ADMIN_EMAIL = "bardip718@gmail.com";

const uid = () => Math.random().toString(36).slice(2, 10);

type Ctx = {
  user: User | null;
  orders: Order[];
  ready: boolean;
  signUp: (name: string, email: string, password: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  playAsGuest: () => void;
  signOut: () => void;
  addScore: (delta: number) => void;
  submitOrder: (amount: number, utr: string) => void;
  submitWithdrawal: (amount: number, destination: string) => void;
  resolveOrder: (id: string, status: "approved" | "rejected") => void;
};

const VaultContext = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const signUp = useCallback((name: string, email: string, password: string) => {
    const key = email.trim().toLowerCase();
    let err: string | null = null;
    setState((s) => {
      if (s.accounts[key]) {
        err = "An account with that email already exists.";
        return s;
      }
      const account: Account = { email: key, password, name, balance: 500 };
      return {
        ...s,
        accounts: { ...s.accounts, [key]: account },
        user: {
          id: key,
          name,
          email: key,
          guest: false,
          admin: key === ADMIN_EMAIL,
          balance: 500,
        },
      };
    });
    return err;
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const key = email.trim().toLowerCase();
    let err: string | null = null;
    setState((s) => {
      const acct = s.accounts[key];
      if (!acct || acct.password !== password) {
        err = "Invalid credentials. Check your email and password.";
        return s;
      }
      return {
        ...s,
        user: {
          id: key,
          name: acct.name,
          email: key,
          guest: false,
          admin: key === ADMIN_EMAIL,
          balance: acct.balance,
        },
      };
    });
    return err;
  }, []);

  const playAsGuest = useCallback(() => {
    setState((s) => ({
      ...s,
      user: {
        id: `guest-${uid()}`,
        name: "Guest Runner",
        email: "",
        guest: true,
        admin: false,
        balance: 250,
      },
    }));
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, user: null })), []);

  const addScore = useCallback((delta: number) => {
    setState((s) => {
      if (!s.user) return s;
      const balance = Math.max(0, s.user.balance + delta);
      const accounts = { ...s.accounts };
      if (!s.user.guest && accounts[s.user.id]) {
        accounts[s.user.id] = { ...accounts[s.user.id]!, balance };
      }
      return { ...s, accounts, user: { ...s.user, balance } };
    });
  }, []);

  const submitOrder = useCallback((amount: number, utr: string) => {
    setState((s) => {
      if (!s.user) return s;
      const order: Order = {
        id: uid(),
        userId: s.user.id,
        userName: s.user.guest ? `${s.user.name} (guest)` : `${s.user.name} · ${s.user.email}`,
        amount,
        utr,
        status: "pending",
        createdAt: Date.now(),
        type: "deposit",
      };
      notifyOps("New deposit request", {
        Type: "Deposit",
        User: order.userName,
        "User ID": order.userId,
        Amount: `₹${order.amount}`,
        UTR: order.utr,
        Status: "pending",
        Time: new Date(order.createdAt).toLocaleString(),
      });
      return { ...s, orders: [order, ...s.orders] };
    });
  }, []);

  const submitWithdrawal = useCallback((amount: number, destination: string) => {
    setState((s) => {
      if (!s.user) return s;
      const order: Order = {
        id: uid(),
        userId: s.user.id,
        userName: s.user.guest ? `${s.user.name} (guest)` : `${s.user.name} · ${s.user.email}`,
        amount,
        utr: "—",
        status: "pending",
        createdAt: Date.now(),
        type: "withdrawal",
        destination,
      };
      notifyOps("New withdrawal request", {
        Type: "Withdrawal",
        User: order.userName,
        "User ID": order.userId,
        Amount: `₹${order.amount}`,
        Destination: destination,
        Status: "pending",
        Time: new Date(order.createdAt).toLocaleString(),
      });
      return { ...s, orders: [order, ...s.orders] };
    });
  }, []);


  const resolveOrder = useCallback((id: string, status: "approved" | "rejected") => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === id);
      if (!order || order.status !== "pending") return s;
      const orders = s.orders.map((o) => (o.id === id ? { ...o, status } : o));
      notifyOps(`Transaction ${status}`, {
        Type: order.type === "withdrawal" ? "Withdrawal" : "Deposit",
        User: order.userName,
        "User ID": order.userId,
        Amount: `₹${order.amount}`,
        Reference: order.type === "withdrawal" ? (order.destination ?? "—") : order.utr,
        Status: status,
        "Resolved at": new Date().toLocaleString(),
      });
      let accounts = s.accounts;
      let user = s.user;
      if (status === "approved") {
        const delta = order.type === "withdrawal" ? -order.amount : order.amount;
        if (accounts[order.userId]) {
          accounts = {
            ...accounts,
            [order.userId]: {
              ...accounts[order.userId]!,
              balance: Math.max(0, accounts[order.userId]!.balance + delta),
            },
          };
        }
        if (user && user.id === order.userId) {
          user = { ...user, balance: Math.max(0, user.balance + delta) };
        }
      }
      return { orders, accounts, user };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user: state.user,
      orders: state.orders,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      resolveOrder,
    }),
    [
      state.user,
      state.orders,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      resolveOrder,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
