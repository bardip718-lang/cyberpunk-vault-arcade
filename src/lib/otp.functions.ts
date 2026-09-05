import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";
const SERVICE_NAME = "win1";

type Creds = { lovableKey: string; twilioKey: string };

function creds(): Creds {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  if (!lovableKey || !twilioKey) {
    throw new Error("Phone verification is not configured yet. Connect Twilio to enable OTP login.");
  }
  return { lovableKey, twilioKey };
}

async function gateway(
  { lovableKey, twilioKey }: Creds,
  method: "GET" | "POST",
  path: string,
  form?: Record<string, string>,
) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(form ? { body: new URLSearchParams(form) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Twilio gateway ${method} ${path} failed [${res.status}]: ${text}`);
    throw new Error(`Verification service error [${res.status}]: ${text}`);
  }
  return text ? (JSON.parse(text) as Record<string, unknown>) : {};
}

async function serviceSid(c: Creds): Promise<string> {
  const fromEnv = process.env["TWILIO_VERIFY_SERVICE_SID"];
  if (fromEnv) return fromEnv;
  const list = (await gateway(c, "GET", "/verify/v2/Services?PageSize=50")) as {
    services?: Array<{ sid: string; friendly_name: string }>;
  };
  const existing = list.services?.find((s) => s.friendly_name === SERVICE_NAME);
  if (existing) return existing.sid;
  const created = (await gateway(c, "POST", "/verify/v2/Services", {
    FriendlyName: SERVICE_NAME,
    CodeLength: "6",
  })) as { sid: string };
  return created.sid;
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  throw new Error("Enter a valid 10-digit Indian mobile number.");
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; channel?: "sms" | "whatsapp" }) => input)
  .handler(async ({ data }) => {
    const c = creds();
    const to = toE164(data.phone);
    const sid = await serviceSid(c);
    const channel = data.channel ?? "sms";
    const res = (await gateway(c, "POST", `/verify/v2/Services/${sid}/Verifications`, {
      To: to,
      Channel: channel,
    })) as { status?: string };
    return { ok: true, phone: to, channel, status: res.status ?? "pending" };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; code: string }) => input)
  .handler(async ({ data }) => {
    const c = creds();
    const to = toE164(data.phone);
    const code = data.code.replace(/\D/g, "");
    if (code.length < 4) throw new Error("Enter the code you received.");
    const sid = await serviceSid(c);
    const res = (await gateway(c, "POST", `/verify/v2/Services/${sid}/VerificationCheck`, {
      To: to,
      Code: code,
    })) as { status?: string };
    if (res.status !== "approved") {
      return { ok: false as const, message: "That code is incorrect or expired." };
    }
    return { ok: true as const, phone: to };
  });
