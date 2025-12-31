import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
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

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9\-_\.]/gi, "_");
}

function wrapText(text: string, maxChars: number) {
  const lines: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\t/g, "    ");
    if (!line.trim()) {
      lines.push("");
      continue;
    }

    const words = line.split(/\s+/);
    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        // if a single word is longer than maxChars, hard-split it
        if (w.length > maxChars) {
          for (let i = 0; i < w.length; i += maxChars) {
            lines.push(w.slice(i, i + maxChars));
          }
          current = "";
        } else {
          current = w;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, { key: "api:generate-pdf", limit: 12, windowMs: 60_000 });
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

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // A4 page size in points
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const margin = 54; // ~0.75 inch
    const fontSize = 11;
    const lineHeight = 14;

    // Conservative wrapping by character count (keeps it simple and robust)
    const maxChars = 95;
    const lines = wrapText(content, maxChars);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of lines) {
      if (y < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      // Empty line
      if (!line) {
        y -= lineHeight;
        continue;
      }

      page.drawText(line, {
        x: margin,
        y: y - fontSize,
        size: fontSize,
        font,
      });
      y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    const safeName = sanitizeFilename(filename || "resume-optimized");

    const res = new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      },
    });
    if (setCookie) res.headers.set("Set-Cookie", setCookie);
    return res;
  } catch (err: unknown) {
    return NextResponse.json({ error: errToString(err) }, { status: 500 });
  }
}
