'use client';

import React, { useState } from 'react';

function extractKeywords(text: string, limit = 40) {
  if (!text) return [];
  const stop = new Set(["the","and","for","with","a","an","to","of","in","on","by","is","are","as","that","this","will","be","or","from","at","we","you","your","our"]);
  const tokens = text.toLowerCase().replace(/https?:\/\/\S+/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean).filter(t=>t.length>3 && !stop.has(t));
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t]||0)+1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([k])=>k);
}
function sectionSplit(resume: string) {
  const headings = ['experience','work experience','professional experience','education','skills','summary','projects','certifications'];
  const lines = resume.split(/\r?\n/);
  const sections: Record<string,string[]> = { Other: [] };
  let current = 'Other';
  for (const raw of lines) {
    const l = raw.trim(); const low = l.toLowerCase();
    const head = headings.find(h => low === h || low.startsWith(h+':') || low.startsWith(h+' -') || low === h.toUpperCase());
    if (head) { current = head[0].toUpperCase()+head.slice(1); sections[current] = sections[current]||[]; continue; }
    sections[current] = sections[current]||[]; sections[current].push(raw);
  }
  return sections;
}
function generateSectionImprovements(sections: Record<string,string[]>, jdKeywords: string[], roleKeywords: string[]) {
  const out: Record<string,string[]> = {};
  for (const [sec, lines] of Object.entries(sections)) {
    const text = lines.join(' ').toLowerCase(); const suggestions: string[] = [];
    if (sec.toLowerCase().includes('experience')) {
      if (!/\d/.test(text)) suggestions.push('Add numeric metrics to bullets (e.g., increased X by Y%).');
      suggestions.push('Lead bullets with action verbs; quantify outcomes.');
      const missing = jdKeywords.slice(0,6).filter(k => !text.includes(k));
      if (missing.length) suggestions.push(`Consider adding keywords: ${missing.join(', ')}`);
    } else if (sec.toLowerCase().includes('skills')) {
      suggestions.push('List core technical skills/tools clearly (comma-separated).');
    } else if (sec.toLowerCase().includes('summary')) {
      suggestions.push('Make the summary role-focused; highlight top achievements.');
    } else {
      suggestions.push('Ensure consistent formatting and dates.');
    }
    out[sec] = suggestions;
  }
  return out;
}
function generateOptimizedResume(resume: string, jdKeywords: string[], roleKeywords: string[]) {
  const lines = resume.split(/\r?\n/); const out: string[] = [];
  for (const raw of lines) {
    const l = raw.trim(); if (!l) { out.push(''); continue; }
    if (/^[-•*]\s+/.test(l) || /^\d+\.\s+/.test(l) || (l.length < 80 && l.endsWith(':'))) {
      let bullet = l.replace(/^[-•*\d\.\)\s]+/,'').trim();
      bullet = bullet[0]?.toUpperCase() + bullet.slice(1);
      if (!/\d/.test(bullet)) bullet += ' [add metric]';
      for (const k of [...jdKeywords,...roleKeywords]) { const re = new RegExp(`\\b${k}\\b`,'ig'); bullet = bullet.replace(re, m => m.toUpperCase()); }
      out.push('- ' + bullet);
    } else {
      let paragraph = l;
      for (const k of [...jdKeywords,...roleKeywords]) { const re = new RegExp(`\\b${k}\\b`,'ig'); paragraph = paragraph.replace(re, m => m.toUpperCase()); }
      out.push(paragraph);
    }
  }
  return out.join('\n');
}

export default function ResumeOptimizer() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [location, setLocation] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [jdMatchScore, setJdMatchScore] = useState<number | null>(null);
  const [sectionImprovements, setSectionImprovements] = useState<Record<string,string[]>>({});
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);
  const [parsingMsg, setParsingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0]; if (!f) return;
    setFileName(f.name);
    try {
      if (f.type === 'text/plain' || f.name.toLowerCase().endsWith('.txt')) {
        const txt = await f.text();
        setResumeText(txt); setParsingMsg('Loaded text file.');
      } else {
        setParsingMsg('For PDF/DOCX best-effort parsing is available.');
        const fd = new FormData(); fd.append('file', f, f.name);
        const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
        const json = await res.json();
        if (res.ok && json.text) { setResumeText(json.text); setParsingMsg('Parsed file. Review the text.'); }
        else { setParsingMsg('Could not parse — please paste resume text.'); }
      }
    } catch {
      setParsingMsg('Failed to read file — please paste resume text.');
    }
  }

  function resetAll() {
    setFileName(null); setResumeText(''); setJobDesc(''); setTargetRole(''); setLocation('');
    setAtsScore(null); setJdMatchScore(null); setSectionImprovements({}); setOptimizedResume(null);
    setParsingMsg(null); setError(null);
  }

  function optimize() {
    setError(null);
    if (!resumeText.trim()) { setError('Paste your resume text or upload a file.'); return; }
    if (!targetRole.trim()) { setError('Enter a target role/title.'); return; }
    if (!jobDesc.trim()) { setError('Paste a job description.'); return; }

    const jdKeywords = extractKeywords(jobDesc + ' ' + targetRole, 40);
    const roleKeywords = extractKeywords(targetRole, 20);
    const resumeLower = resumeText.toLowerCase();
    const matchedJD = jdKeywords.filter(k => resumeLower.includes(k));
    const matchedRole = roleKeywords.filter(k => resumeLower.includes(k));
    const ats = jdKeywords.length ? Math.round((matchedJD.length / jdKeywords.length) * 100) : 0;
    const jdMatch = roleKeywords.length ? Math.round((matchedRole.length / roleKeywords.length) * 100) : 0;

    const sections = sectionSplit(resumeText);
    const improvements = generateSectionImprovements(sections, jdKeywords, roleKeywords);
    const optimized = generateOptimizedResume(resumeText, jdKeywords, roleKeywords);

    setAtsScore(ats); setJdMatchScore(jdMatch);
    setSectionImprovements(improvements); setOptimizedResume(optimized);
  }

  function wrapText(text: string, font: any, size: number, maxWidth: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const cand = line ? line + " " + w : w;
      if (font.widthOfTextAtSize(cand, size) <= maxWidth) line = cand;
      else { if (line) lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawLines(page: any, lines: string[], font: any, size: number, x: number, yStart: number, lh: number, color: any) {
    let y = yStart;
    for (const ln of lines) { page.drawText(ln, { x, y, size, font, color }); y -= lh; }
    return y;
  }

  async function downloadDocx() {
    if (!optimizedResume) return;
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      const lines = optimizedResume.split(/\r?\n/);
      const paragraphs: any[] = [];
      const headerText = [targetRole.trim(), location.trim()].filter(Boolean).join(" — ");
      if (headerText) { paragraphs.push(new Paragraph({ text: headerText, heading: HeadingLevel.HEADING_2 })); paragraphs.push(new Paragraph({ text: "" })); }
        for (const raw of lines) {
        const l = raw.trim();
        if (!l) { paragraphs.push(new Paragraph({ text: "" })); continue; }
          if (l.startsWith("- ")) paragraphs.push(new Paragraph({ children: [new TextRun(l.replace(/^-\s*/, ""))], bullet: { level: 0 } }));
        else paragraphs.push(new Paragraph({ children: [new TextRun(l)] }));
      }
      const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `${(fileName || "resume").replace(/\.[^/.]+$/, '')}-optimized.docx`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setError("docx generator missing. Run: npm install docx"); }
  }

  async function downloadPdf() {
    if (!optimizedResume) return;
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([612, 792]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const margin = 48; let maxWidth = page.getWidth() - margin * 2; let x = margin; let y = page.getHeight() - margin;

      const headerText = [targetRole.trim(), location.trim()].filter(Boolean).join(" — ");
      if (headerText) { const size = 16; const hdrLines = wrapText(headerText, fontBold, size, maxWidth); y = drawLines(page, hdrLines, fontBold, size, x, y, 20, rgb(1,1,1)); y -= 8; }

      const lines = optimizedResume.split(/\r?\n/);
      for (const raw of lines) {
        const l = raw.trim(); if (!l) { y -= 12; continue; }
        const isBullet = l.startsWith("- "); const txt = isBullet ? l.replace(/^-+\s*/, "") : l;
        const size = 11; const wrapped = wrapText(txt, font, size, maxWidth - (isBullet ? 12 : 0));
        if (isBullet) { page.drawCircle({ x: x + 3, y: y - 4, radius: 2, color: rgb(0.95,0.95,0.95) }); y = drawLines(page, wrapped, font, size, x + 12, y, 16, rgb(0.95,0.95,0.95)); }
        else { y = drawLines(page, wrapped, font, size, x, y, 16, rgb(0.95,0.95,0.95)); }
        y -= 6;
        if (y < margin + 50) { page = pdfDoc.addPage([612, 792]); x = margin; y = page.getHeight() - margin; maxWidth = page.getWidth() - margin * 2; }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `${(fileName || "resume").replace(/\.[^/.]+$/, '')}-optimized.pdf`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setError("pdf generator missing. Run: npm install pdf-lib"); }
  }

  function downloadTxt() {
    if (!optimizedResume) return;
    const blob = new Blob([optimizedResume], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${(fileName || "resume").replace(/\.[^/.]+$/, '')}-optimized.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Resume Optimizer</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Resume File:</label>
        <input type="file" accept=".txt,.pdf,.docx" onChange={handleFile} className="border rounded-md p-2 w-full" />
        {parsingMsg && <p className="text-xs text-gray-500 mt-1">{parsingMsg}</p>}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Paste Job Description:</label>
        <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} className="border rounded-md p-2 w-full h-24" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Target Role/Title:</label>
        <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)} className="border rounded-md p-2 w-full" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Location:</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="border rounded-md p-2 w-full" />
      </div>
      <div className="mb-4">
        <button onClick={optimize} className="bg-blue-600 text-white rounded-md px-4 py-2 mr-2">
          Optimize Resume
        </button>
        <button onClick={resetAll} className="bg-gray-300 rounded-md px-4 py-2">
          Reset All
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {atsScore !== null && jdMatchScore !== null && (
        <div className="bg-gray-100 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-500 mb-2">ATS Score: <span className="font-semibold">{atsScore}%</span></p>
          <p className="text-sm text-gray-500 mb-2">JD Match Score: <span className="font-semibold">{jdMatchScore}%</span></p>
        </div>
      )}
      {Object.keys(sectionImprovements).length > 0 && (
        <div className="bg-gray-100 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-500 mb-2">Section Improvements:</p>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {Object.entries(sectionImprovements).map(([sec, suggestions]) => (
              <li key={sec} className="mb-1"><span className="font-semibold">{sec}:</span> {suggestions.join(' ')}</li>
            ))}
          </ul>
        </div>
      )}
      {optimizedResume && (
        <div className="bg-gray-100 rounded-md p-4 mb-4">
          <p className="text-sm text-gray-500 mb-2">Optimized Resume:</p>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{optimizedResume}</pre>
        </div>
      )}
      <div className="flex space-x-2">
        <button onClick={() => navigator.clipboard?.writeText(optimizedResume ?? '')} className="text-sm bg-white/6 px-3 py-1 rounded">
          Copy
        </button>
        <button onClick={downloadDocx} className="text-sm bg-white/6 px-3 py-1 rounded">
          Download .docx
        </button>
        <button onClick={downloadPdf} className="text-sm bg-white/6 px-3 py-1 rounded">
          Download .pdf
        </button>
        <button onClick={downloadTxt} className="text-sm bg-white/6 px-3 py-1 rounded">
          Download .txt
        </button>
      </div>
    </div>
  );
}
