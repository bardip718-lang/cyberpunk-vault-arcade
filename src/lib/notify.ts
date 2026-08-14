export const SUPPORT_WHATSAPP = "https://wa.me/918317848513";
export const OPS_EMAIL = "bardip718@gmail.com";

const LOG_KEY = "win1-notification-log";

export type NotificationEntry = {
  id: string;
  to: string;
  subject: string;
  body: string;
  createdAt: number;
};

export function readNotificationLog(): NotificationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as NotificationEntry[]) : [];
  } catch {
    return [];
  }
}

/** Logs a full transaction report addressed to the operator email. */
export function notifyOps(subject: string, details: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const body = Object.entries(details)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const entry: NotificationEntry = {
    id: Math.random().toString(36).slice(2, 10),
    to: OPS_EMAIL,
    subject,
    body,
    createdAt: Date.now(),
  };
  const next = [entry, ...readNotificationLog()].slice(0, 200);
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  console.info(`[win1 notification → ${OPS_EMAIL}] ${subject}\n${body}`);
  window.dispatchEvent(new CustomEvent("win1-notification"));
}
