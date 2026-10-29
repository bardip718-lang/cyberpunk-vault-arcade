/**
 * Server-only operator authorisation.
 *
 * The operator console is authorised with a passcode that only lives in the
 * server environment (ADMIN_CONSOLE_PASSCODE). Never trust an email or an
 * "isAdmin" flag sent by the client — those are visible in the browser bundle
 * and can be forged by anyone calling the endpoint directly.
 */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function assertOperator(passcode: string): void {
  const expected = process.env["ADMIN_CONSOLE_PASSCODE"]?.trim();
  passcode = (passcode ?? "").trim();
  if (!expected || expected.length < 6) {
    throw new Error("Operator passcode is not configured on the server (ADMIN_CONSOLE_PASSCODE missing or under 6 characters). Reset it in Project Settings → Secrets.");
  }
  if (!passcode || !timingSafeEqual(passcode, expected)) {
    throw new Error(`Not authorized: invalid operator passcode (you entered ${passcode.length} characters; check spelling and capital letters).`);
  }
}
