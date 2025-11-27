import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

export const runtime = "node";

export async function POST(req: Request) {
  try {
    const { content, filename } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    // Build a simple docx: split content into paragraphs
    const doc = new Document();
    const paragraphs = content.split(/\r?\n/).map(line => {
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

    doc.addSection({ children: paragraphs });

    const buffer = await Packer.toBuffer(doc);
    const res = new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(filename || "resume-optimized").replace(/[^a-z0-9\-_\.]/gi, "_")}.docx"`,
      },
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
