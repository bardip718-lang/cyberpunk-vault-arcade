export const SUPPORT_WHATSAPP = "https://wa.me/918317848513?text=Hi%2C%20I%20need%20help%20with%20win1%20vault";

export async function notifyTelegram(message: string): Promise<boolean> {
  const BOT_TOKEN = "8263590059:AAEQE966r5O2H52Z0H-s_vWfJj3y_r5k6E4"; // default placeholder / fallback
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
    console.warn("Telegram notification skipped or failed:", error);
    return false;
  }
}
