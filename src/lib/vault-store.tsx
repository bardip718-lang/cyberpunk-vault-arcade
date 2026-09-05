import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import depositQrAsset from "@/assets/deposit-qr.png.asset.json";

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
  upiId: "8317848513@ybl",
  displayName: "WIN1 VAULT",
  qrUrl: depositQrAsset.url,
};

type State = {
  user: User;
  accounts: Record<string, Account>;
  payment: PaymentSettings;
  usedVouchers: string[];
};

const KEY = "win1-vault-state-v5";
const defaultUser: User = {
  id: "player-" + Math.floor(1000 + Math.random() * 9000),
  name: "Guest Player",
  email: "",
  guest: true,
  admin: false,
  balance: 250,
};

const empty: State = {
  user: defaultUser,
  accounts: {},
  payment: DEFAULT_PAYMENT_SETTINGS,
  usedVouchers: [],
};

// Simple secret verification algorithm: Code format: W1-<AMOUNT>-<ANY_4_CHAR_TOKEN>
// Example valid codes: W1-100-X7A9, W1-250-M4K2, W1-500-P9L1, W1-1000-B8Q3
function verifyAndExtractAmount(code: string): number | null {
  const clean = code.trim().toUpperCase();
  const match = clean.match(/^W1-(50|100|200|250|500|1000|2000|5000)-[A-Z0-9]{4}$/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

function load(): State {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...empty,
      ...parsed,
      user: parsed.user ?? defaultUser,
      usedVouchers: parsed.usedVouchers ?? [],
      payment: { ...DEFAULT_PAYMENT_SETTINGS, ...(parsed.payment ?? {}) },
    };
  } catch {
    return empty;
  }
}

export const ADMIN_EMAIL = "bardip718@gmail.com";

type RedeemResult = { success: boolean; message: string; amount?: number };

type Ctx = {
  user: User;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  signInWithPhone: (phoneE164: string) => { isNew: boolean; key: string };
  playAsGuest: () => void;
  signOut: () => void;
  addScore: (delta: number) => void;
  redeemVoucher: (code: string) => RedeemResult;
  applyReferralBonus: (bonusEarned: number) => number;
  payment: PaymentSettings;
  updatePaymentSettings: (next: Partial<PaymentSettings>) => void;
};

const VaultContext = createContext<Ctx | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);
  const [appliedBonus, setAppliedBonus] = useState(0);

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

  // Phone sign-in: the OTP is verified server-side before this is called.
  const signInWithPhone = useCallback((phoneE164: string) => {
    const key = phoneE164.trim();
    let isNew = false;
    setState((s) => {
      const existing = s.accounts[key];
      isNew = !existing;
      const name = existing?.name ?? `Player ${key.slice(-4)}`;
      const balance = existing?.balance ?? 500;
      const account: Account = { email: key, password: "", name, balance };
      return {
        ...s,
        accounts: { ...s.accounts, [key]: account },
        user: { id: key, name, email: key, guest: false, admin: false, balance },
      };
    });
    return { isNew, key };
  }, []);

  const playAsGuest = useCallback(() => {
    setState((s) => ({ ...s, user: defaultUser }));
  }, []);

  const signOut = useCallback(() => {
    setState((s) => ({ ...s, user: defaultUser }));
  }, []);

  const addScore = useCallback((delta: number) => {
    setState((s) => {
      const current = s.user ?? defaultUser;
      const newBal = Math.max(0, (current.balance ?? 0) + delta);
      const updatedUser = { ...current, balance: newBal };
      const updatedAccounts = { ...s.accounts };

      if (!current.guest && updatedAccounts[current.id]) {
        updatedAccounts[current.id] = {
          ...updatedAccounts[current.id]!,
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

  // Secure One-Time Voucher Verification
  const redeemVoucher = useCallback((rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    if (!clean) {
      return { success: false, message: "Please enter a voucher code." };
    }

    if (state.usedVouchers.includes(clean)) {
      return { success: false, message: "This voucher has ALREADY been used!" };
    }

    const val = verifyAndExtractAmount(clean);
    if (!val) {
      return { success: false, message: "Invalid code format! Ask admin on WhatsApp." };
    }

    let result: RedeemResult = { success: false, message: "" };

    setState((s) => {
      if (s.usedVouchers.includes(clean)) {
        result = { success: false, message: "This voucher has ALREADY been used!" };
        return s;
      }

      const current = s.user ?? defaultUser;
      const newBal = (current.balance ?? 0) + val;
      const updatedUser = { ...current, balance: newBal };
      const updatedAccounts = { ...s.accounts };

      if (!current.guest && updatedAccounts[current.id]) {
        updatedAccounts[current.id] = {
          ...updatedAccounts[current.id]!,
          balance: newBal,
        };
      }

      result = {
        success: true,
        message: `₹${val} added to your balance!`,
        amount: val,
      };

      return {
        ...s,
        accounts: updatedAccounts,
        user: updatedUser,
        usedVouchers: [...s.usedVouchers, clean],
      };
    });

    return result;
  }, [state.usedVouchers]);

  /**
   * Credits the net-new portion of a referral bonus into the player's balance.
   * Idempotent per session: only the delta above the previously credited amount
   * is applied, so a polled profile that hasn't changed never re-credits.
   */
  const applyReferralBonus = useCallback(
    (bonusEarned: number) => {
      if (!Number.isFinite(bonusEarned) || bonusEarned <= appliedBonus) return 0;
      const delta = bonusEarned - appliedBonus;
      setAppliedBonus(bonusEarned);
      setState((s) => {
        const current = s.user ?? defaultUser;
        const newBal = Math.max(0, (current.balance ?? 0) + delta);
        const updatedAccounts = { ...s.accounts };
        if (!current.guest && updatedAccounts[current.id]) {
          updatedAccounts[current.id] = {
            ...updatedAccounts[current.id]!,
            balance: newBal,
          };
        }
        return { ...s, accounts: updatedAccounts, user: { ...current, balance: newBal } };
      });
      return delta;
    },
    [appliedBonus],
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
      redeemVoucher,
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
      redeemVoucher,
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
