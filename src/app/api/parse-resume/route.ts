import { NextResponse } from "next/server";
export const runtime = "nodejs";

function safeRequire(name: string): any | null {
  try { /* eslint-disable no-eval */ const req = eval('require') as any; return req?.(name) ?? null; } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const name = (file as any).name || "upload";
    const buf = Buffer.from(await (file as any).arrayBuffer());
    const lname = name.toLowerCase();
    let text = "";

    if (lname.endsWith(".pdf")) {
      const pdfParse = safeRequire("pdf-parse");
      if (pdfParse) {
        const data = await pdfParse(buf); text = data?.text ?? "";
      } else { text = buf.toString("utf8"); }
    } else if (lname.endsWith(".docx") || lname.endsWith(".doc")) {
      const mammoth = safeRequire("mammoth");
      if (mammoth) {
        const res = await mammoth.extractRawText({ buffer: buf }); text = res?.value ?? "";
      } else { text = buf.toString("utf8"); }
    } else {
      text = buf.toString("utf8");
    }

    return NextResponse.json({ text: text || "" });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
