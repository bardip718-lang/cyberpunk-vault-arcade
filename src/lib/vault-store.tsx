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
  /** Withdrawable balance (deposits + winnings) */
  main: number;
  /** Non-withdrawable promo credits (signup + referral) */
  bonus: number;
  /** Total playable balance = main + bonus */
  balance: number;
  referralCode: string;
  referralCount: number;
  referralEarned: number;
  notices: string[];
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

export type AppSettings = {
  upiId: string;
  qrUrl: string;
  displayName: string;
  signupBonus: number;
  referralBonus: number;
};

type Account = {
  email: string;
  password: string;
  name: string;
  main: number;
  bonus: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralEarned: number;
  firstDepositDone: boolean;
  notices: string[];
};

type State = {
  user: User | null;
  accounts: Record<string, Account>;
  orders: Order[];
  settings: AppSettings;
};

const KEY = "win1-vault-state";

export const DEFAULT_SETTINGS: AppSettings = {
  upiId: "7719254845@ybl",
  qrUrl: "",
  displayName: "WIN1 VAULT",
  signupBonus: 50,
  referralBonus: 50,
};

const empty: State = { user: null, accounts: {}, orders: [], settings: DEFAULT_SETTINGS };

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...empty,
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    } as State;
  } catch {
    return empty;
  }
}

export const ADMIN_EMAIL = "bardip718@gmail.com";

const uid = () => Math.random().toString(36).slice(2, 10);
const makeCode = () => `WIN1${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

function toUser(acct: Account): User {
  return {
    id: acct.email,
    name: acct.name,
    email: acct.email,
    guest: false,
    admin: acct.email === ADMIN_EMAIL,
    main: acct.main,
    bonus: acct.bonus,
    balance: acct.main + acct.bonus,
    referralCode: acct.referralCode,
    referralCount: acct.referralCount,
    referralEarned: acct.referralEarned,
    notices: acct.notices ?? [],
  };
}

type Ctx = {
  user: User | null;
  orders: Order[];
  settings: AppSettings;
  ready: boolean;
  signUp: (name: string, email: string, password: string, referralCode?: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  playAsGuest: () => void;
  signOut: () => void;
  addScore: (delta: number) => void;
  submitOrder: (amount: number, utr: string) => void;
  submitWithdrawal: (amount: number, destination: string) => void;
  resolveOrder: (id: string, status: "approved" | "rejected") => void;
  saveSettings: (next: AppSettings) => void;
  clearNotices: () => void;
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

  // Cross-tab / real-time sync of settings and balances
  useEffect(() => {
    if (!ready) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as State;
          setState((s) => ({
            ...parsed,
            user: s.user && !s.user.guest && parsed.accounts[s.user.id]
              ? toUser(parsed.accounts[s.user.id]!)
              : s.user,
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          }));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [ready]);

  const signUp = useCallback(
    (name: string, email: string, password: string, referralCode?: string) => {
      const key = email.trim().toLowerCase();
      let err: string | null = null;
      setState((s) => {
        if (s.accounts[key]) {
          err = "An account with that email already exists.";
          return s;
        }
        const code = (referralCode ?? "").trim().toUpperCase();
        let referrerKey: string | undefined;
        if (code) {
          referrerKey = Object.values(s.accounts).find((a) => a.referralCode === code)?.email;
          if (!referrerKey) {
            err = "That referral code is not valid.";
            return s;
          }
        }
        const bonus = s.settings.signupBonus;
        const account: Account = {
          email: key,
          password,
          name,
          main: 0,
          bonus,
          referralCode: makeCode(),
          referredBy: referrerKey,
          referralCount: 0,
          referralEarned: 0,
          firstDepositDone: false,
          notices: [`Welcome Bonus Credited! 🎉 +${bonus} bonus credits`],
        };
        return { ...s, accounts: { ...s.accounts, [key]: account }, user: toUser(account) };
      });
      return err;
    },
    [],
  );

  const signIn = useCallback((email: string, password: string) => {
    const key = email.trim().toLowerCase();
    let err: string | null = null;
    setState((s) => {
      const acct = s.accounts[key];
      if (!acct || acct.password !== password) {
        err = "Invalid credentials. Check your email and password.";
        return s;
      }
      return { ...s, user: toUser(acct) };
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
        main: 0,
        bonus: 250,
        balance: 250,
        referralCode: "",
        referralCount: 0,
        referralEarned: 0,
        notices: [],
      },
    }));
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, user: null })), []);

  const clearNotices = useCallback(() => {
    setState((s) => {
      if (!s.user || s.user.notices.length === 0) return s;
      const accounts = { ...s.accounts };
      if (!s.user.guest && accounts[s.user.id]) {
        accounts[s.user.id] = { ...accounts[s.user.id]!, notices: [] };
      }
      return { ...s, accounts, user: { ...s.user, notices: [] } };
    });
  }, []);

  /** Bets (negative) drain bonus first, then main. Winnings (positive) go to main only. */
  const addScore = useCallback((delta: number) => {
    setState((s) => {
      if (!s.user) return s;
      let { main, bonus } = s.user;
      if (delta >= 0) {
        main += delta;
      } else {
        let owed = -delta;
        const fromBonus = Math.min(bonus, owed);
        bonus -= fromBonus;
        owed -= fromBonus;
        main = Math.max(0, main - owed);
      }
      const accounts = { ...s.accounts };
      if (!s.user.guest && accounts[s.user.id]) {
        accounts[s.user.id] = { ...accounts[s.user.id]!, main, bonus };
      }
      return { ...s, accounts, user: { ...s.user, main, bonus, balance: main + bonus } };
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

      const accounts = { ...s.accounts };
      let user = s.user;

      if (status === "approved") {
        const isWithdrawal = order.type === "withdrawal";
        const target = accounts[order.userId];
        if (target) {
          const main = isWithdrawal
            ? Math.max(0, target.main - order.amount)
            : target.main + order.amount;
          accounts[order.userId] = { ...target, main };

          // Referral payout on the referred friend's FIRST approved deposit
          if (!isWithdrawal && !target.firstDepositDone) {
            accounts[order.userId] = { ...accounts[order.userId]!, firstDepositDone: true };
            const refKey = target.referredBy;
            const referrer = refKey ? accounts[refKey] : undefined;
            if (refKey && referrer) {
              const reward = s.settings.referralBonus;
              accounts[refKey] = {
                ...referrer,
                bonus: referrer.bonus + reward,
                referralCount: referrer.referralCount + 1,
                referralEarned: referrer.referralEarned + reward,
                notices: [
                  ...(referrer.notices ?? []),
                  `Your friend deposited! You received a Referral Bonus! 🎁 +${reward} credits`,
                ],
              };
              notifyOps("Referral bonus credited", {
                Referrer: refKey,
                Friend: order.userId,
                Bonus: `${reward} credits`,
                Time: new Date().toLocaleString(),
              });
            }
          }
        } else if (user && user.id === order.userId) {
          const main = isWithdrawal
            ? Math.max(0, user.main - order.amount)
            : user.main + order.amount;
          user = { ...user, main, balance: main + user.bonus };
        }
      }

      if (user && !user.guest && accounts[user.id]) user = toUser(accounts[user.id]!);
      return { ...s, orders, accounts, user };
    });
  }, []);

  const saveSettings = useCallback((next: AppSettings) => {
    setState((s) => ({ ...s, settings: { ...DEFAULT_SETTINGS, ...next } }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      user: state.user,
      orders: state.orders,
      settings: state.settings,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      resolveOrder,
      saveSettings,
      clearNotices,
    }),
    [
      state.user,
      state.orders,
      state.settings,
      ready,
      signUp,
      signIn,
      playAsGuest,
      signOut,
      addScore,
      submitOrder,
      submitWithdrawal,
      resolveOrder,
      saveSettings,
      clearNotices,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
