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
import depositQrAsset from "@/assets/deposit-qr.png.asset.json";
import { submitRequest, listRequests, type VaultRequest } from "@/lib/requests.functions";

export type User = {
  id: string;
  name: string;
  email: string;
  guest: boolean;
  admin: boolean;
  balance: number;
};

type Account = { email: string; password: string; name: string; balance: number };

export type PaymentSettings = {
  upiId: string;
  displayName: string;
  qrUrl: string;
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  upiId: "7719254845@ybl",
  displayName: "WIN1 VAULT",
  qrUrl: depositQrAsset.url,
};

type State = {
  user: User | null;
  accounts: Record<string, Account>;
  payment: PaymentSettings;
  applied: string[];
  bonusApplied: Record<string, number>;
};

const KEY = "win1-vault-state-v2";
const empty: State = {
  user: null,
  accounts: {},
  payment: DEFAULT_PAYMENT_SETTINGS,
  applied: [],
  bonusApplied: {},
};

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...empty,
      ...parsed,
      applied: parsed.applied ?? [],
      bonusApplied: parsed.bonusApplied ?? {},
      payment: { ...DEFAULT_PAYMENT_SETTINGS, ...(parsed.payment ?? {}) },
    };
  } catch {
    return empty;
  }
}

export const ADMIN_EMAIL = "bardip718@gmail.com";

type Ctx = {
  user: User | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  playAsGuest: () => void;
  signOut: () => void;
  addScore: (delta: number) => void;
  submitOrder: (amount: number, utr: string) => Promise<void>;
  submitWithdrawal: (amount: number, destination: string) => Promise<void>;
  applyResolved: (requests: VaultRequest[]) => void;
  applyReferralBonus: (totalEarned: number) => number;
  payment: PaymentSettings;
  updatePaymentSettings: (next: Partial<PaymentSettings>) => void;
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
          balance: acct.balance ?? 500,
        },
      };
    });
    return err;
  }, []);

  const playAsGuest = useCallback(() => {
    setState((s) => {
      if (s.user && s.user.guest) return s;
      return {
        ...s,
        user: {
          id: "guest-player",
          name: "Guest Player",
          email: "",
          guest: true,
          admin: false,
          balance: 250,
        },
      };
    });
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, user: null })), []);

  // Real-time Balance Cut / Add Logic for Gameplay
  const addScore = useCallback((delta: number) => {
    setState((s) => {
      if (!s.user) return s;
      const newBal = Math.max(0, (s.user.balance ?? 0) + delta);
      const updatedUser = { ...s.user, balance: newBal };
      const updatedAccounts = { ...s.accounts };

      if (!s.user.guest && updatedAccounts[s.user.id]) {
        updatedAccounts[s.user.id] = {
          ...updatedAccounts[s.user.id]!,
          balance: newBal,
        };
      }

      return {
        ...s,
        accounts: updatedAccounts,
        user: updatedUser,
      };
    });
  }, []);

  const submitOrder = useCallback(
    async (amount: number, utr: string) => {
      const user = state.user;
      if (!user) throw new Error("Sign in first.");
      const created = await submitRequest({
        data: {
          kind: "deposit",
          userKey: user.id,
          userName: user.guest ? `${user.name} (guest)` : user.name,
          userEmail: user.email,
          amount,
          utr,
          destination: "",
        },
      });
      notifyOps("deposit", {
        Type: "Deposit",
        User: created.userName,
        "User ID": created.userKey,
        Amount: `₹${created.amount}`,
        UTR: created.utr,
        Status: "pending",
        Time: new Date(created.createdAt).toLocaleString(),
      });
    },
    [state.user],
  );

  const submitWithdrawal = useCallback(
    async (amount: number, destination: string) => {
      const user = state.user;
      if (!user) throw new Error("Sign in first.");
      const created = await submitRequest({
        data: {
          kind: "withdrawal",
          userKey: user.id,
          userName: user.guest ? `${user.name} (guest)` : user.name,
          userEmail: user.email,
          amount,
          utr: "",
          destination,
        },
      });
      addScore(-amount);
      notifyOps("withdraw", {
        Type: "Withdrawal",
        User: created.userName,
        "User ID": created.userKey,
        Amount: `₹${created.amount}`,
        Destination: destination,
        Status: "pending",
        Time: new Date(created.createdAt).toLocaleString(),
      });
    },
    [state.user, addScore],
  );

  // Approve par Instant Balance Add Logic
  const applyResolved = useCallback(
    (requests: VaultRequest[]) => {
      setState((s) => {
        if (!s.user) return s;
        const appliedSet = new Set(s.applied);
        let accounts = { ...s.accounts };
        let currentUser = { ...s.user };
        let appliedList = [...s.applied];
        let stateChanged = false;

        for (const r of requests) {
          if (r.status === "pending") continue;
          const key = `${r.id}:${r.status}`;
          if (appliedSet.has(key)) continue;

          let delta = 0;
          if (r.kind === "deposit" && r.status === "approved") delta = r.amount;
          if (r.kind === "withdrawal" && r.status === "rejected") delta = r.amount;

          if (accounts[r.userKey]) {
            accounts[r.userKey] = {
              ...accounts[r.userKey]!,
              balance: Math.max(0, (accounts[r.userKey]!.balance ?? 0) + delta),
            };
          }

          // Balance instantly player ko attach hoga
          currentUser.balance = Math.max(0, (currentUser.balance ?? 0) + delta);

          appliedList.push(key);
          appliedSet.add(key);
          stateChanged = true;
        }

        if (!stateChanged) return s;
        return {
          ...s,
          accounts,
          user: currentUser,
          applied: appliedList,
        };
      });
    },
    [],
  );

  // Background Live Sync Loop
  useEffect(() => {
    if (!ready || !state.user) return;
    const sync = async () => {
      try {
        const all = await listRequests();
        if (all && all.length > 0) {
          applyResolved(all);
        }
      } catch {
        // silent fail
      }
    };
    sync();
    const timer = setInterval(sync, 2000);
    return () => clearInterval(timer);
  }, [ready, state.user, applyResolved]);

  const applyReferralBonus = useCallback(
    (totalEarned: number) => {
      let credited = 0;
      setState((s) => {
        if (!s.user) return s;
        const already = s.bonusApplied[s.user.id] ?? 0;
        const delta = Math.max(0, totalEarned - already);
        if (delta === 0) return s;
        credited = delta;
        const newBal = Math.max(0, (s.user.balance ?? 0) + delta);
        return {
          ...s,
          user: { ...s.user, balance: newBal },
          bonusApplied: { ...s.bonusApplied, [s.user.id]: totalEarned },
        };
      });
      return credited;
    },
    [],
  );

  const updatePaymentSettings = useCallback((next: Partial<PaymentSettings>) => {
    setState((s) => ({ ...s, payment: { ...DEFAULT_PAYMENT_SETTINGS, ...s.payment, ...next } }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user: state.user,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      applyResolved,
      applyReferralBonus,
      payment: state.payment ?? DEFAULT_PAYMENT_SETTINGS,
      updatePaymentSettings,
    }),
    [
      state.user,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      applyResolved,
      applyReferralBonus,
      state.payment,
      updatePaymentSettings,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
    }
        

        

      
