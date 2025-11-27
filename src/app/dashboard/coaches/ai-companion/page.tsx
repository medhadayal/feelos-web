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

export default function AICompanionPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617,#071029)] text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">AI Companion</h1>
            <p className="text-sm text-slate-300 mt-1">Chat, video preview and avatar conferencing demo.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm bg-white/6 rounded px-3 py-2">Back</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: video / avatar */}
          <div className="lg:col-span-2">
            <VideoConference />
          </div>

          {/* Right: chat widget */}
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
