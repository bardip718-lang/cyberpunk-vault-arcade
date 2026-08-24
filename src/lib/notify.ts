export const SUPPORT_WHATSAPP = "https://wa.me/918317848513?text=Hi%2C%20I%20need%20help%20with%20win1%20vault";
export const OPS_EMAIL = "bardip718@gmail.com";

const LOG_KEY = "win1-notification-log-v1";

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

export function writeNotificationLog(entry: Omit<NotificationEntry, "id" | "createdAt">): NotificationEntry {
  const full: NotificationEntry = {
    ...entry,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    const prev = readNotificationLog();
    window.localStorage.setItem(LOG_KEY, JSON.stringify([full, ...prev].slice(0, 50)));
  }

  return full;
}

export async function notifyTelegram(message: string): Promise<boolean> {
  writeNotificationLog({
    to: "Admin",
    subject: "Deposit/Withdraw Action",
    body: message,
  });
  return true;
}
