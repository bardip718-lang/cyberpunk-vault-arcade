import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "deposit-proofs";

export type RequestKind = "deposit" | "withdrawal";
export type RequestStatus = "pending" | "approved" | "rejected";

export type VaultRequest = {
  id: string;
  kind: RequestKind;
  userKey: string;
  userName: string;
  userEmail: string;
  amount: number;
  utr: string;
  destination: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  /** Storage path of the uploaded payment screenshot (empty when none). */
  screenshotPath: string;
  /** Short-lived signed URL for the screenshot, when available. */
  screenshotUrl: string | null;
};

type Row = {
  id: string;
  kind: string;
  user_key: string;
  user_name: string;
  user_email: string;
  amount: number;
  utr: string;
  destination: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  screenshot_url: string | null;
};

function mapRow(row: Row, signed: string | null): VaultRequest {
  return {
    id: row.id,
    kind: row.kind === "withdrawal" ? "withdrawal" : "deposit",
    userKey: row.user_key,
    userName: row.user_name,
    userEmail: row.user_email ?? "",
    amount: Number(row.amount),
    utr: row.utr ?? "",
    destination: row.destination ?? "",
    status:
      row.status === "approved" ? "approved" : row.status === "rejected" ? "rejected" : "pending",
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    screenshotPath: row.screenshot_url ?? "",
    screenshotUrl: signed,
  };
}

async function readRequests(ownerId?: string): Promise<VaultRequest[]> {
 const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
 let query = supabaseAdmin.from("transaction_requests").select("*").order("created_at", { ascending: false });
 if (ownerId) query = query.eq("owner_id", ownerId);
 const rows: Row[] = [];
 for (let offset=0; ;offset+=500) { const {data,error}=await query.range(offset,offset+499); if(error) throw new Error("Could not load transaction records. Please retry."); rows.push(...(data??[]) as unknown as Row[]); if((data?.length??0)<500)break; }
 const paths=rows.map(row=>row.screenshot_url).filter((path):path is string=>!!path);
 const urls=new Map<string,string>();
 if(paths.length) {const {data}=await supabaseAdmin.storage.from(BUCKET).createSignedUrls(paths,300);for(const item of data??[])if(item.path&&item.signedUrl)urls.set(item.path,item.signedUrl);}
 return rows.map(row=>mapRow(row, row.screenshot_url ? urls.get(row.screenshot_url)??null : null));
}
export const listRequests = createServerFn({method:"GET"}).middleware([requireSupabaseAuth]).handler(async ({context})=>readRequests(context.userId));
export const listOperatorRequests = createServerFn({method:"POST"}).inputValidator((input:unknown)=>z.object({adminPasscode:z.string().min(1).max(200)}).parse(input)).handler(async ({data})=>{const {assertOperator}=await import("@/lib/admin-auth.server");assertOperator(data.adminPasscode);return readRequests();});

const submitSchema = z.object({
  kind: z.enum(["deposit", "withdrawal"]),
  userKey: z.string().min(1).max(120),
  userName: z.string().min(1).max(120),
  userEmail: z.string().max(160).default(""),
  amount: z.number().int().min(100).max(1_000_000),
  requestKey: z.string().uuid(),
  utr: z.string().max(40).default(""),
  destination: z.string().max(300).default(""),
  /** data:image/...;base64,xxxx */
  screenshotDataUrl: z.string().max(7_000_000).default(""),
});

export const submitRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }): Promise<VaultRequest> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const {data: identity, error: identityError}=await context.supabase.auth.getUser();
    if(identityError || !identity.user)throw new Error("A verified account is required to submit requests.");
    const userKey=identity.user.phone || identity.user.email || context.userId;
    if(data.kind==="deposit" && (!/^\d{12}$/.test(data.utr) || !/^data:image\/(png|jpeg|webp);base64,/.test(data.screenshotDataUrl)))throw new Error("Enter a 12-digit UTR and upload a PNG, JPEG or WebP screenshot.");
    const {data: existing}=await supabaseAdmin.from("transaction_requests").select("*").eq("request_key",data.requestKey).eq("owner_id",context.userId).maybeSingle();
    if(existing)return mapRow(existing as unknown as Row,null);
    let screenshotPath = "";
    if (data.screenshotDataUrl.startsWith("data:image/")) {
      const [meta, b64] = data.screenshotDataUrl.split(",");
      if (b64) {
        const contentType = meta?.slice(5).split(";")[0] ?? "image/png";
        const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        if(bytes.length>5*1024*1024)throw new Error("Screenshot must be under 5 MB.");
        const path = `${context.userId}/${data.requestKey}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType, upsert: false });
        if (upErr) throw new Error("Screenshot upload failed. Please retry.");
        screenshotPath = path;
      }
    }

    const {data: inserted,error}=await supabaseAdmin.rpc("submit_vault_request", {p_owner:context.userId,p_key:userKey,p_name:String(identity.user.user_metadata?.["name"]||"Player"),p_email:identity.user.email||"",p_kind:data.kind,p_amount:data.amount,p_utr:data.utr,p_destination:data.destination,p_screenshot:screenshotPath,p_request_key:data.requestKey});
    if (error) throw new Error(error.message);

    return mapRow(inserted as unknown as Row, null);
  });

const resolveSchema = z.object({
  adminPasscode: z.string().min(1).max(200),
  id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export const resolveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resolveSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    const { assertOperator } = await import("@/lib/admin-auth.server");
    assertOperator(data.adminPasscode);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const {data: updated,error}=await supabaseAdmin.rpc("resolve_vault_request",{p_id:data.id,p_status:data.status});
    if (error) throw new Error(error.message);
    return mapRow(updated as unknown as Row, null);
  });
