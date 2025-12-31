import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function safeRequire(name: string): unknown {
  try {
    const reqUnknown = eval("require") as unknown;
    if (typeof reqUnknown !== "function") return null;
    return (reqUnknown as (id: string) => unknown)(name);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:parse-resume", limit: 6, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const form = await req.formData();
    const maybeFile = form.get("file");
    if (!(maybeFile instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const name = maybeFile.name || "upload";
    const buf = Buffer.from(await maybeFile.arrayBuffer());
    const lname = name.toLowerCase();
    let text = "";

    if (lname.endsWith(".pdf")) {
      const pdfParse = safeRequire("pdf-parse");
      if (typeof pdfParse === "function") {
        const parsed = await (pdfParse as (b: Buffer) => Promise<{ text?: string }>)(buf);
        text = parsed?.text ?? "";
      } else {
        text = buf.toString("utf8");
      }
    } else if (lname.endsWith(".docx") || lname.endsWith(".doc")) {
      const mammoth = safeRequire("mammoth");
      if (isRecord(mammoth) && typeof mammoth.extractRawText === "function") {
        const res = await (mammoth.extractRawText as (opts: { buffer: Buffer }) => Promise<{ value?: string }>)({ buffer: buf });
        text = res?.value ?? "";
      } else {
        text = buf.toString("utf8");
      }
    } else {
      text = buf.toString("utf8");
    }

    const out = NextResponse.json({ text: text || "" });
    if (setCookie) out.headers.set("Set-Cookie", setCookie);
    return out;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
