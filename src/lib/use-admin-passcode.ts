import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "win1-operator-passcode";

/**
 * Keeps the operator passcode for the current browser tab only. The value is
 * verified server-side on every privileged call — it is never trusted here.
 */
export function useAdminPasscode() {
  const [passcode, setPasscodeState] = useState("");

  useEffect(() => {
    try {
      setPasscodeState(window.sessionStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  const setPasscode = useCallback((value: string) => {
    setPasscodeState(value);
    try {
      if (value) window.sessionStorage.setItem(STORAGE_KEY, value);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { passcode, setPasscode, hasPasscode: passcode.length > 0 };
}
