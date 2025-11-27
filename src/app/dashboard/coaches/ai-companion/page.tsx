'use client';

import React, { useRef, useState, useEffect } from "react";
import ChatWidget from '../../../../components/ChatWidget';
import Link from 'next/link';

function VideoConference() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'stopped' | 'running' | 'error'>('stopped');
  const [muted, setMuted] = useState(false);

  async function startVideo() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = muted;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('running');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }

  function stopVideo() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('stopped');
  }

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Avatar • Video Conferencing</h3>
        <span className="text-xs text-slate-400">Local demo</span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="relative rounded-xl bg-black/20 overflow-hidden aspect-video">
          {/* video preview */}
          <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline />
          {/* avatar fallback */}
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="h-20 w-20 rounded-full bg-white/5 mx-auto mb-2 flex items-center justify-center text-xl">You</div>
                <div className="text-sm">Video inactive</div>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 flex items-start justify-center p-3">
              <div className="bg-rose-600/90 text-white text-xs rounded px-2 py-1">Camera access denied or unavailable</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status !== 'running' ? (
            <button onClick={startVideo} className="rounded-md px-3 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900 text-sm">
              Start Video
            </button>
          ) : (
            <button onClick={stopVideo} className="rounded-md px-3 py-2 bg-rose-500 text-white text-sm">
              Stop Video
            </button>
          )}

          <button
            onClick={() => {
              setMuted((m) => {
                const next = !m;
                if (videoRef.current) videoRef.current.muted = next;
                return next;
              });
            }}
            className="rounded-md px-3 py-2 bg-white/6 text-sm"
            aria-pressed={muted}
          >
            {muted ? 'Muted' : 'Unmuted'}
          </button>

          <span className="text-xs text-slate-400 ml-auto">Status: {status}</span>
        </div>

        <div className="text-xs text-slate-400">
          Tip: Allow camera/microphone access in your browser. This demo shows local preview only (no call or streaming).
        </div>
      </div>
    </div>
  );
}

function VideoAvatar() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'stopped'|'running'|'error'>('stopped');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  async function start() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      // Audio analyser
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(s);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setStatus('running');
      renderLoop();
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(()=>{});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setStream(null);
    setStatus('stopped');
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
      }
    }
  }

  function getAudioLevel() {
    const analyser = analyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i=0;i<data.length;i++){
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(1, rms * 3); // scaled 0..1
  }

  function renderLoop() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width = canvas.clientWidth * devicePixelRatio;
    const h = canvas.height = canvas.clientHeight * devicePixelRatio;

    function draw() {
      ctx.clearRect(0,0,w,h);

      // Background
      ctx.fillStyle = '#061022';
      ctx.fillRect(0,0,w,h);

      // Stylized avatar body
      const cx = w/2;
      const cy = h/2;
      const headRadius = Math.min(w,h) * 0.22;

      // Draw head (stylized)
      ctx.beginPath();
      ctx.fillStyle = '#0ea5a9'; // teal-ish avatar color
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 14;
      ctx.arc(cx, cy - headRadius*0.2, headRadius, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = '#fff';
      const eyeOffsetX = headRadius * 0.5;
      const eyeY = cy - headRadius*0.35;
      ctx.beginPath(); ctx.arc(cx - eyeOffsetX, eyeY, headRadius*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOffsetX, eyeY, headRadius*0.12, 0, Math.PI*2); ctx.fill();

      // Pupils
      ctx.fillStyle = '#0b1220';
      ctx.beginPath(); ctx.arc(cx - eyeOffsetX, eyeY, headRadius*0.06, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + eyeOffsetX, eyeY, headRadius*0.06, 0, Math.PI*2); ctx.fill();

      // Mouth animated by audio
      const level = getAudioLevel();
      const mouthWidth = headRadius * 0.8;
      const mouthHeight = Math.max(6, headRadius * 0.12 + level * headRadius*0.18);
      const mouthX = cx - mouthWidth/2;
      const mouthY = cy - headRadius*0.05;
      ctx.fillStyle = '#0b1220';
      roundRect(ctx, mouthX, mouthY, mouthWidth, mouthHeight, mouthHeight/2);
      ctx.fill();

      // Small live webcam preview in corner if available
      if (video && stream) {
        const previewW = w * 0.22;
        const previewH = h * 0.14;
        const px = w - previewW - 20;
        const py = h - previewH - 20;
        ctx.save();
        ctx.beginPath();
        roundRectPath(ctx, px, py, previewW, previewH, 8);
        ctx.clip();
        try {
          ctx.drawImage(video, px, py, previewW, previewH);
        } catch { /* drawImage may throw before video ready */ }
        ctx.restore();
        // border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        roundRect(ctx, px, py, previewW, previewH, 8);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
  }

  useEffect(() => {
    if (status === 'running') renderLoop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t=>t.stop()); if (audioCtxRef.current) audioCtxRef.current.close().catch(()=>{}); };
  }, [stream]);

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Avatar • Live Conferencing</h3>
        <span className="text-xs text-slate-400">Local demo</span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/10">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <video ref={videoRef} className="hidden" playsInline />
        </div>

        <div className="flex items-center gap-2">
          {status !== 'running' ? (
            <button onClick={start} className="rounded-md px-3 py-2 bg-gradient-to-r from-pink-500 to-yellow-300 text-slate-900">
              Start Avatar
            </button>
          ) : (
            <button onClick={stop} className="rounded-md px-3 py-2 bg-rose-500 text-white">
              Stop
            </button>
          )}
          <div className="text-xs text-slate-400 ml-auto">Status: {status}</div>
        </div>

        <div className="text-xs text-slate-400">Avatar animates with your microphone input. Allow camera/mic access in the browser.</div>
      </div>
    </div>
  );
}

// small helper: rounded rect fill
function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) {
  roundRectPath(ctx,x,y,w,h,r);
  ctx.fill();
}
function roundRectPath(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

export default function AICompanionPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">AI Companion</h1>
            <p className="text-sm text-slate-300 mt-1">Chat and live avatar conferencing demo.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm bg-white/6 rounded px-3 py-2">Back</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar / video column */}
          <div className="lg:col-span-2">
            <VideoAvatar />
          </div>

          {/* Chat column */}
          <aside>
            <div className="card p-4">
              <h3 className="font-semibold mb-3">Chat</h3>
              <ChatWidget />
            </div>
            <div className="mt-4 card p-4">
              <h4 className="font-semibold">Quick actions</h4>
              <div className="mt-3 flex flex-col gap-2">
                <button className="px-3 py-2 rounded bg-white/6 text-sm">Start Session</button>
                <button className="px-3 py-2 rounded bg-white/6 text-sm">Share Screen (demo)</button>
                <button className="px-3 py-2 rounded bg-white/6 text-sm">Invite (copy link)</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
