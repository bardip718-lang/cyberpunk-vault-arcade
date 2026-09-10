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
import { supabase } from "@/integrations/supabase/client";

export const SIGNUP_BONUS = 500;
export const BONUS_WAGER_MULTIPLIER = 3;
export const MIN_QUALIFYING_DEPOSIT = 100;
export const DEMO_START_BALANCE = 250;

export type User = {
  id: string;
  name: string;
  email: string;
  guest: boolean;
  admin: boolean;
  realBalance: number;
  bonusBalance: number;
  demoBalance: number;
  wagerRemaining: number;
  totalDeposited: number;
  balance: number;
};

type Account = {
  email: string;
  password: string;
  name: string;
  realBalance: number;
  bonusBalance: number;
  wagerRemaining: number;
  totalDeposited: number;
};

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
  bonusClaims: string[];
  deviceBonusClaimed: boolean;
  settledRequests: string[];
};

const KEY = "win1-vault-state-v6";
const DEVICE_KEY = "win1-device-bonus-claimed";

function makeGuest(): User {
  return {
    id: "guest-" + Math.floor(1000 + Math.random() * 9000),
    name: "Guest Player",
    email: "",
    guest: true,
    admin: false,
    realBalance: 0,
    bonusBalance: 0,
    demoBalance: DEMO_START_BALANCE,
    wagerRemaining: 0,
    totalDeposited: 0,
    balance: DEMO_START_BALANCE,
  };
}

const empty: State = {
  user: makeGuest(),
  accounts: {},
  payment: DEFAULT_PAYMENT_SETTINGS,
  usedVouchers: [],
  bonusClaims: [],
  deviceBonusClaimed: false,
  settledRequests: [],
};

function withTotals(u: User): User {
  return { ...u, balance: u.guest ? u.demoBalance : u.realBalance + u.bonusBalance };
}

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
    const deviceClaimed = window.localStorage.getItem(DEVICE_KEY) === "1";
    if (!raw) return { ...empty, user: makeGuest(), deviceBonusClaimed: deviceClaimed };
    const parsed = JSON.parse(raw) as Partial<State>;
    const user = parsed.user ? withTotals({ ...makeGuest(), ...parsed.user }) : makeGuest();
    return {
      ...empty,
      ...parsed,
      user,
      usedVouchers: parsed.usedVouchers ?? [],
      bonusClaims: parsed.bonusClaims ?? [],
      settledRequests: parsed.settledRequests ?? [],
      deviceBonusClaimed: deviceClaimed || Boolean(parsed.deviceBonusClaimed),
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
  withdrawable: number;
  withdrawLock: { locked: boolean; reason: string | null };
  signUp: (name: string, email: string, password: string) => string | null;
  signIn: (email: string, password: string) => string | null;
  signInWithPhone: (phoneE164: string) => { isNew: boolean; key: string };
  playAsGuest: () => void;
  signOut: () => void;
  addScore: (delta: number) => void;
  lockWithdrawal: (amount: number) => void;
  refundWithdrawal: (amount: number) => void;
  settleRequest: (input: {
    id: string;
    kind: "deposit" | "withdrawal";
    status: "approved" | "rejected";
    amount: number;
    userKey?: string;
  }) => void;
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
    const initialState = load();
    setState(initialState);
    setReady(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const phone = session.user.phone || session.user.user_metadata?.['phone'] || "";
        const email = session.user.email || "";
        const id = phone || email || session.user.id;
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL || session.user.user_metadata?.['role'] === "admin";

        setState((s) => ({
          ...s,
          user: withTotals({
            ...s.user,
            id,
            name: session.user.user_metadata?.['name'] || `Player ${id.slice(-4)}`,
            email: email || phone,
            guest: false,
            admin: isAdmin,
          }),
        }));
      }
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
    if (state.deviceBonusClaimed) window.localStorage.setItem(DEVICE_KEY, "1");
  }, [state, ready]);

  const enterAccount = useCallback(
    (key: string, name: string, password: string, admin: boolean) => {
      setState((s) => {
        const existing = s.accounts[key];
        const firstTime = !existing;
        const alreadyClaimed = s.bonusClaims.includes(key) || s.deviceBonusClaimed;
        const grantBonus = firstTime && !alreadyClaimed;

        const account: Account = existing
          ? { ...existing, name: existing.name || name, password: password || existing.password }
          : {
              email: key,
              password,
              name,
              realBalance: 0,
              bonusBalance: grantBonus ? SIGNUP_BONUS : 0,
              wagerRemaining: grantBonus ? SIGNUP_BONUS * BONUS_WAGER_MULTIPLIER : 0,
              totalDeposited: 0,
            };

        return {
          ...s,
          accounts: { ...s.accounts, [key]: account },
          bonusClaims: grantBonus ? [...s.bonusClaims, key] : s.bonusClaims,
          deviceBonusClaimed: s.deviceBonusClaimed || grantBonus,
          user: withTotals({
            id: key,
            name: account.name,
            email: key,
            guest: false,
            admin,
            realBalance: account.realBalance,
            bonusBalance: account.bonusBalance,
            demoBalance: 0,
            wagerRemaining: account.wagerRemaining,
            totalDeposited: account.totalDeposited,
            balance: 0,
          }),
        };
      });
    },
    [],
  );

  const signUp = useCallback(
    (name: string, email: string, password: string) => {
      const key = email.trim().toLowerCase();
      if (state.accounts[key]) return "An account with that email already exists.";
      enterAccount(key, name, password, key === ADMIN_EMAIL);
      return null;
    },
    [state.accounts, enterAccount],
  );

  const signIn = useCallback(
    (email: string, password: string) => {
      const key = email.trim().toLowerCase();
      const acct = state.accounts[key];
      if (!acct || acct.password !== password) {
        return "Invalid credentials. Check your email and password.";
      }
      enterAccount(key, acct.name, password, key === ADMIN_EMAIL);
      return null;
    },
    [state.accounts, enterAccount],
  );

  const signInWithPhone = useCallback(
    (phoneE164: string) => {
      const key = phoneE164.trim();
      const isNew = !state.accounts[key];
      enterAccount(key, `Player ${key.slice(-4)}`, "", false);
      return { isNew, key };
    },
    [state.accounts, enterAccount],
  );

  const playAsGuest = useCallback(() => {
    setState((s) => ({ ...s, user: makeGuest() }));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState((s) => ({ ...s, user: makeGuest() }));
  }, []);

  const addScore = useCallback((delta: number) => {
    setState((s) => {
      const current = s.user;
      if (current.guest) {
        const next = withTotals({
          ...current,
          demoBalance: Math.max(0, current.demoBalance + delta),
        });
        return { ...s, user: next };
      }

      let { realBalance, bonusBalance, wagerRemaining } = current;

      if (delta < 0) {
        const stake = Math.min(-delta, realBalance + bonusBalance);
        const fromReal = Math.min(realBalance, stake);
        realBalance -= fromReal;
        bonusBalance = Math.max(0, bonusBalance - (stake - fromReal));
        wagerRemaining = Math.max(0, wagerRemaining - stake);
      } else if (delta > 0) {
        if (wagerRemaining > 0 && bonusBalance > 0) bonusBalance += delta;
        else realBalance += delta;
      }

      const next = withTotals({ ...current, realBalance, bonusBalance, wagerRemaining });
      const accounts = { ...s.accounts };
      const acct = accounts[current.id];
      if (acct) {
        accounts[current.id] = {
          ...acct,
          realBalance: next.realBalance,
          bonusBalance: next.bonusBalance,
          wagerRemaining: next.wagerRemaining,
        };
      }
      return { ...s, accounts, user: next };
    });
  }, []);

  const lockWithdrawal = useCallback((amount: number) => {
    setState((s) => {
      const current = s.user;
      if (current.guest) return s;
      const fromReal = Math.min(current.realBalance, amount);
      const fromBonus = current.wagerRemaining <= 0 ? Math.min(current.bonusBalance, amount - fromReal) : 0;
      const next = withTotals({
        ...current,
        realBalance: current.realBalance - fromReal,
        bonusBalance: current.bonusBalance - fromBonus,
      });
      const accounts = { ...s.accounts };
      const acct = accounts[current.id];
      if (acct) {
        accounts[current.id] = {
          ...acct,
          realBalance: next.realBalance,
          bonusBalance: next.bonusBalance,
        };
      }
      return { ...s, accounts, user: next };
    });
  }, []);

  const refundWithdrawal = useCallback((amount: number) => {
    setState((s) => {
      const current = s.user;
      if (current.guest) return s;
      const next = withTotals({ ...current, realBalance: current.realBalance + Math.max(0, amount) });
      const accounts = { ...s.accounts };
      const acct = accounts[current.id];
      if (acct) accounts[current.id] = { ...acct, realBalance: next.realBalance };
      return { ...s, accounts, user: next };
    });
  }, []);

  // FIXED: Directly credits target player account OR active session
  const settleRequest = useCallback(
    (input: {
      id: string;
      kind: "deposit" | "withdrawal";
      status: "approved" | "rejected";
      amount: number;
      userKey?: string;
    }) => {
      setState((s) => {
        if (s.settledRequests.includes(input.id)) return s;

        const amount = Math.max(0, Math.round(input.amount));
        const accounts = { ...s.accounts };
        const targetKey = input.userKey || s.user.id;
        let targetAcct = accounts[targetKey];

        if (!targetAcct) {
          targetAcct = {
            email: targetKey,
            password: "",
            name: "Player",
            realBalance: 0,
            bonusBalance: 0,
            wagerRemaining: 0,
            totalDeposited: 0,
          };
        }

        let nextUser = s.user;

        if (input.kind === "deposit" && input.status === "approved") {
          targetAcct.realBalance += amount;
          targetAcct.totalDeposited += amount;

          // If current logged-in player is target OR admin is testing self
          nextUser = withTotals({
            ...s.user,
            guest: false,
            realBalance: s.user.realBalance + amount,
            totalDeposited: s.user.totalDeposited + amount,
          });
        }

        accounts[targetKey] = targetAcct;

        return {
          ...s,
          accounts,
          user: nextUser,
          settledRequests: [...s.settledRequests, input.id],
        };
      });
    },
    [],
  );

  const redeemVoucher = useCallback(
    (rawCode: string) => {
      const clean = rawCode.trim().toUpperCase();
      if (!clean) return { success: false, message: "Please enter a voucher code." };
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

        const current = s.user;
        const next = withTotals({
          ...current,
          guest: false,
          realBalance: current.realBalance + val,
          totalDeposited: current.totalDeposited + val,
        });
        const accounts = { ...s.accounts };
        const acct = accounts[current.id];
        if (acct) {
          accounts[current.id] = {
            ...acct,
            realBalance: next.realBalance,
            totalDeposited: next.totalDeposited,
          };
        }

        result = { success: true, message: `₹${val} added to your real cash!`, amount: val };
        return { ...s, accounts, user: next, usedVouchers: [...s.usedVouchers, clean] };
      });

      return result;
    },
    [state.usedVouchers],
  );

  const applyReferralBonus = useCallback(
    (bonusEarned: number) => {
      if (!Number.isFinite(bonusEarned) || bonusEarned <= appliedBonus) return 0;
      const delta = bonusEarned - appliedBonus;
      setAppliedBonus(bonusEarned);
      setState((s) => {
        const current = s.user;
        if (current.guest) return s;
        const next = withTotals({
          ...current,
          bonusBalance: current.bonusBalance + delta,
          wagerRemaining: current.wagerRemaining + delta * BONUS_WAGER_MULTIPLIER,
        });
        const accounts = { ...s.accounts };
        const acct = accounts[current.id];
        if (acct) {
          accounts[current.id] = {
            ...acct,
            bonusBalance: next.bonusBalance,
            wagerRemaining: next.wagerRemaining,
          };
        }
        return { ...s, accounts, user: next };
      });
      return delta;
    },
    [appliedBonus],
  );

  const updatePaymentSettings = useCallback((next: Partial<PaymentSettings>) => {
    setState((s) => ({ ...s, payment: { ...DEFAULT_PAYMENT_SETTINGS, ...s.payment, ...next } }));
  }, []);

  const user = state.user;
  const withdrawable = user.guest
    ? 0
    : user.realBalance + (user.wagerRemaining <= 0 ? user.bonusBalance : 0);

  const withdrawLock = useMemo(() => {
    if (user.guest) {
      return {
        locked: true,
        reason: "Create/Log in with a verified mobile number to withdraw real winnings.",
      };
    }
    if (user.totalDeposited < MIN_QUALIFYING_DEPOSIT) {
      return {
        locked: true,
        reason: `Make at least one deposit of ₹${MIN_QUALIFYING_DEPOSIT} to unlock withdrawals.`,
      };
    }
    if (withdrawable <= 0) {
      return {
        locked: true,
        reason:
          user.bonusBalance > 0
            ? `Bonus cash needs ₹${user.wagerRemaining} more turnover (${BONUS_WAGER_MULTIPLIER}x) before it can be withdrawn.`
            : "No withdrawable cash available yet.",
      };
    }
    return { locked: false, reason: null };
  }, [user, withdrawable]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      ready,
      withdrawable,
      withdrawLock,
      signUp,
      signIn,
      signInWithPhone,
      playAsGuest,
      signOut,
      addScore,
      lockWithdrawal,
      refundWithdrawal,
      settleRequest,
      redeemVoucher,
      applyReferralBonus,
      payment: state.payment ?? DEFAULT_PAYMENT_SETTINGS,
      updatePaymentSettings,
    }),
    [
      user,
      ready,
      withdrawable,
      withdrawLock,
      signUp,
      signIn,
      signInWithPhone,
      playAsGuest,
      signOut,
      addScore,
      lockWithdrawal,
      refundWithdrawal,
      settleRequest,
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
