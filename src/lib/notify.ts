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
  const BOT_TOKEN = "8263590059:AAEQE966r5O2H52Z0H-s_vWfJj3y_r5k6E4";
  const CHAT_ID = "6190823451";

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    return true;
  } catch (error) {
    console.warn("Telegram notification failed:", error);
    return false;
  }
}

