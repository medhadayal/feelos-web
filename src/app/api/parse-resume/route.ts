import { NextResponse } from "next/server";

export const runtime = "node";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const name = (file as any).name || "upload";
    const arrayBuffer = await (file as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = "";
    const lname = name.toLowerCase();

    if (lname.endsWith(".pdf")) {
      const pdfParse = await import("pdf-parse");
      const data = await (pdfParse as any)(buffer);
      text = data?.text ?? "";
    } else if (lname.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const res = await (mammoth as any).extractRawText({ buffer });
      text = res?.value ?? "";
    } else if (lname.endsWith(".doc")) {
      try {
        const mammoth = await import("mammoth");
        const res = await (mammoth as any).extractRawText({ buffer });
        text = res?.value ?? buffer.toString("utf8");
      } catch {
        text = buffer.toString("utf8");
      }
    } else {
      // plain text fallback
      text = buffer.toString("utf8");
    }

    if (!text) text = "";

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
