import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { rateLimit } from "../../../lib/rateLimit";
import { getOrCreateSessionUserId } from "../../../lib/session";

export const runtime = "nodejs";

type Body = {
  content: string;
  filename?: string;
};

function errToString(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:generate-docx", limit: 12, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetMs - Date.now()) / 1000)) } }
      );
    }

    const { setCookie } = getOrCreateSessionUserId(req);

    const { content, filename } = (await req.json()) as Body;
    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    // Build a simple docx: split content into paragraphs
    const paragraphs = content.split(/\r?\n/).map((line) => {
      // use bold for headings heuristically (line ends with ':' or is short)
      const trimmed = line.trim();
      if (!trimmed) return new Paragraph("");
      if (/^[A-Z][\w\s]{0,60}:$/.test(trimmed) || trimmed.toUpperCase() === trimmed && trimmed.length < 40) {
        return new Paragraph({
          children: [new TextRun({ text: trimmed.replace(/:$/, ''), bold: true })],
        });
      }
      return new Paragraph({ children: [new TextRun({ text: trimmed })] });
    });

    const doc = new Document({
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = (filename || "resume-optimized").replace(/[^a-z0-9\-_\.]/gi, "_");
    const res = new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}.docx"`,
      },
    });
    if (setCookie) res.headers.set("Set-Cookie", setCookie);
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
